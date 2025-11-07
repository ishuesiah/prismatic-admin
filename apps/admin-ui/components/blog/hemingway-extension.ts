import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export interface HemingwayOptions {
  enabled: boolean
}

export interface GrammarError {
  type: "spelling" | "grammar" | "punctuation"
  text: string
  suggestion: string
  position: { start: number, end: number }
  explanation: string
}

export const HemingwayExtension = Extension.create<HemingwayOptions>({
  name: "hemingway",

  addOptions() {
    return {
      enabled: true,
    }
  },

  addStorage() {
    return {
      grammarErrors: [] as GrammarError[],
    }
  },

  addProseMirrorPlugins() {
    const extensionThis = this

    return [
      new Plugin({
        key: new PluginKey("hemingway"),
        
        state: {
          init() {
            return DecorationSet.empty
          },
          
          apply(tr, set) {
            if (!extensionThis.options.enabled) {
              return createGrammarDecorations(tr.doc, extensionThis.storage.grammarErrors || [])
            }

            // Rebuild decorations on document change or when we have grammar errors
            if (tr.docChanged || tr.getMeta("grammarErrors")) {
              const grammarErrors = tr.getMeta("grammarErrors") || extensionThis.storage.grammarErrors || []
              const readabilityDecorations = createDecorations(tr.doc)
              const grammarDecorations = createGrammarDecorations(tr.doc, grammarErrors)
              
              // Merge both decoration sets
              return readabilityDecorations.add(tr.doc, grammarDecorations.find().map(d => d))
            }
            
            return set.map(tr.mapping, tr.doc)
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state)
          },
          
          handleClick(view, pos, event) {
            // Check if click is on a grammar error
            const decorations = this.getState(view.state)
            let clickedError: GrammarError | null = null
            
            if (decorations) {
              decorations.find(pos, pos).forEach((deco: any) => {
                if (deco.spec.grammarError) {
                  clickedError = deco.spec.grammarError
                }
              })
            }
            
            if (clickedError && event.target instanceof HTMLElement) {
              // Show correction popup
              showCorrectionPopup(event.target, clickedError, view)
              return true
            }
            
            return false
          },
        },
      }),
    ]
  },
})

// Create grammar error decorations
function createGrammarDecorations(doc: any, errors: GrammarError[]): DecorationSet {
  const decorations: Decoration[] = []
  
  errors.forEach((error) => {
    // Find the error in the document
    let found = false
    doc.descendants((node: any, pos: number) => {
      if (found) return false
      
      if (node.isText && node.text.includes(error.text)) {
        const index = node.text.indexOf(error.text)
        const from = pos + index
        const to = from + error.text.length
        
        let className = "grammar-error"
        if (error.type === "spelling") {
          className = "grammar-spelling-error"
        } else if (error.type === "punctuation") {
          className = "grammar-punctuation-error"
        }
        
        decorations.push(
          Decoration.inline(from, to, {
            class: className,
            "data-tooltip": `${error.explanation}\nSuggestion: "${error.suggestion}"`,
            grammarError: error,
          } as any)
        )
        
        found = true
      }
    })
  })
  
  return DecorationSet.create(doc, decorations)
}

// Show correction popup
function showCorrectionPopup(target: HTMLElement, error: GrammarError, view: any) {
  // Remove any existing popup
  const existingPopup = document.querySelector('.grammar-correction-popup')
  if (existingPopup) {
    existingPopup.remove()
  }
  
  // Create popup element
  const popup = document.createElement('div')
  popup.className = 'grammar-correction-popup'
  popup.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">${error.type === 'spelling' ? 'Spelling' : error.type === 'grammar' ? 'Grammar' : 'Punctuation'} Error</div>
      <div class="popup-text">
        <strong>Error:</strong> "${error.text}"<br>
        <strong>Suggestion:</strong> "${error.suggestion}"
      </div>
      <div class="popup-explanation">${error.explanation}</div>
      <div class="popup-actions">
        <button class="popup-apply">Apply</button>
        <button class="popup-ignore">Ignore</button>
      </div>
    </div>
  `
  
  // Position popup near the clicked text
  const rect = target.getBoundingClientRect()
  popup.style.position = 'fixed'
  popup.style.left = `${rect.left}px`
  popup.style.top = `${rect.bottom + 5}px`
  popup.style.zIndex = '10000'
  
  document.body.appendChild(popup)
  
  // Handle button clicks
  popup.querySelector('.popup-apply')?.addEventListener('click', () => {
    // Apply the correction
    const { state } = view
    const { tr, doc } = state
    
    // Find the error position again
    let found = false
    doc.descendants((node: any, pos: number) => {
      if (found) return false
      
      if (node.isText && node.text) {
        const index = node.text.indexOf(error.text)
        if (index !== -1) {
          const from = pos + index
          const to = pos + index + error.text.length
          
          // Replace the text with the suggestion
          tr.replaceWith(from, to, state.schema.text(error.suggestion))
          found = true
        }
      }
    })
    
    if (found) {
      // Apply the transaction
      view.dispatch(tr)
      
      // Also update the grammar errors list to remove this error
      const decorations = view.state.plugins.find((p: any) => p.key.key === "hemingway")
      if (decorations) {
        const newErrors = view.state.plugins[0]?.spec?.grammarErrors?.filter(
          (e: GrammarError) => e.text !== error.text
        ) || []
        
        // Trigger a new decoration update without this error
        const updateTr = view.state.tr
        updateTr.setMeta("grammarErrors", newErrors)
        view.dispatch(updateTr)
      }
    }
    
    popup.remove()
  })
  
  popup.querySelector('.popup-ignore')?.addEventListener('click', () => {
    popup.remove()
  })
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target as Node)) {
        popup.remove()
        document.removeEventListener('click', closePopup)
      }
    })
  }, 10)
}

function createDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === "paragraph" || node.type.name === "heading") {
      const text = node.textContent
      if (!text.trim()) return

      // Split into sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
      let currentPos = pos + 1 // +1 for node start

      sentences.forEach((sentence: string) => {
        const trimmedSentence = sentence.trim()
        if (!trimmedSentence) return

        const words = trimmedSentence.match(/\b\w+\b/g) || []
        const wordCount = words.length

        // Find sentence position in text
        const sentenceStart = text.indexOf(trimmedSentence, currentPos - pos - 1)
        if (sentenceStart === -1) return

        const from = pos + 1 + sentenceStart
        const to = from + trimmedSentence.length

        // Highlight complex sentences
        if (wordCount > 30) {
          // Very hard to read - RED
          decorations.push(
            Decoration.inline(from, to, {
              class: "hemingway-very-hard",
              "data-tooltip": `This sentence has ${wordCount} words. Very hard to read. Consider breaking it into smaller sentences.`,
            })
          )
        } else if (wordCount > 20) {
          // Hard to read - YELLOW
          decorations.push(
            Decoration.inline(from, to, {
              class: "hemingway-hard",
              "data-tooltip": `This sentence has ${wordCount} words. Hard to read. Consider simplifying.`,
            })
          )
        }

        // Highlight adverbs (words ending in -ly)
        const adverbPattern = /\b\w+ly\b/gi
        let match
        while ((match = adverbPattern.exec(trimmedSentence)) !== null) {
          const adverbStart = from + match.index
          const adverbEnd = adverbStart + match[0].length
          
          decorations.push(
            Decoration.inline(adverbStart, adverbEnd, {
              class: "hemingway-adverb",
              "data-tooltip": `Adverb detected: "${match[0]}". Consider using stronger verbs instead.`,
            })
          )
        }

        // Highlight passive voice
        const passivePattern = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi
        let passiveMatch
        while ((passiveMatch = passivePattern.exec(trimmedSentence)) !== null) {
          const passiveStart = from + passiveMatch.index
          const passiveEnd = passiveStart + passiveMatch[0].length
          
          decorations.push(
            Decoration.inline(passiveStart, passiveEnd, {
              class: "hemingway-passive",
              "data-tooltip": `Passive voice: "${passiveMatch[0]}". Consider using active voice.`,
            })
          )
        }

        // Highlight complex phrases
        const complexPhrases = [
          /\b(could|should|would|might|may|can)\s+be\s+able\s+to\b/gi,
          /\bit\s+is\s+important\s+to\b/gi,
          /\bin\s+order\s+to\b/gi,
        ]
        
        complexPhrases.forEach((pattern) => {
          let complexMatch
          while ((complexMatch = pattern.exec(trimmedSentence)) !== null) {
            const complexStart = from + complexMatch.index
            const complexEnd = complexStart + complexMatch[0].length
            
            decorations.push(
              Decoration.inline(complexStart, complexEnd, {
                class: "hemingway-complex",
                "data-tooltip": `Complex phrase: "${complexMatch[0]}". Consider simplifying.`,
              })
            )
          }
        })

        currentPos += trimmedSentence.length
      })
    }
  })

  return DecorationSet.create(doc, decorations)
}
