// verify-auth-setup.js
// Run this script to check if your authentication is configured correctly
// Usage: node verify-auth-setup.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying NextAuth Setup...\n');

let issues = [];
let warnings = [];

// 1. Check .env.local file exists
console.log('1️⃣  Checking environment file...');
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  issues.push('❌ .env.local file not found');
} else {
  console.log('   ✅ .env.local exists');
  
  // Read env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check required variables
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      issues.push(`❌ Missing ${varName} in .env.local`);
    } else if (envContent.includes(`${varName}=""`)) {
      issues.push(`❌ ${varName} is empty in .env.local`);
    } else {
      console.log(`   ✅ ${varName} is set`);
    }
  });
  
  // Check NEXTAUTH_URL format
  if (envContent.includes('NEXTAUTH_URL')) {
    const match = envContent.match(/NEXTAUTH_URL="([^"]+)"/);
    if (match) {
      const url = match[1];
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        issues.push('❌ NEXTAUTH_URL must start with http:// or https://');
      }
      if (url.endsWith('/')) {
        warnings.push('⚠️  NEXTAUTH_URL should not end with /');
      }
    }
  }
}

console.log();

// 2. Check NextAuth route file
console.log('2️⃣  Checking NextAuth route handler...');
const nextAuthPath = path.join(__dirname, 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
if (!fs.existsSync(nextAuthPath)) {
  issues.push('❌ Missing app/api/auth/[...nextauth]/route.ts');
} else {
  console.log('   ✅ NextAuth route handler exists');
  
  // Check file content
  const routeContent = fs.readFileSync(nextAuthPath, 'utf8');
  if (!routeContent.includes('GoogleProvider')) {
    warnings.push('⚠️  GoogleProvider not found in route.ts');
  }
  if (!routeContent.includes('export { handler as GET, handler as POST }')) {
    issues.push('❌ Missing export { handler as GET, handler as POST } in route.ts');
  }
}

console.log();

// 3. Check Providers component
console.log('3️⃣  Checking SessionProvider setup...');
const providersPath = path.join(__dirname, 'app', 'providers.tsx');
if (!fs.existsSync(providersPath)) {
  issues.push('❌ Missing app/providers.tsx');
} else {
  console.log('   ✅ providers.tsx exists');
  
  const providersContent = fs.readFileSync(providersPath, 'utf8');
  if (!providersContent.includes('SessionProvider')) {
    issues.push('❌ SessionProvider not found in providers.tsx');
  }
  if (!providersContent.includes('"use client"')) {
    issues.push('❌ Missing "use client" directive in providers.tsx');
  }
}

console.log();

// 4. Check Layout uses Providers
console.log('4️⃣  Checking layout configuration...');
const layoutPath = path.join(__dirname, 'app', 'layout.tsx');
if (!fs.existsSync(layoutPath)) {
  issues.push('❌ Missing app/layout.tsx');
} else {
  console.log('   ✅ layout.tsx exists');
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (!layoutContent.includes('Providers')) {
    issues.push('❌ Layout does not import/use Providers component');
  } else {
    console.log('   ✅ Layout uses Providers component');
  }
}

console.log();

// 5. Check package.json dependencies
console.log('5️⃣  Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPackages = [
    'next-auth',
    '@prisma/client',
    '@auth/prisma-adapter'
  ];
  
  requiredPackages.forEach(pkg => {
    if (!deps[pkg]) {
      issues.push(`❌ Missing dependency: ${pkg}`);
    } else {
      console.log(`   ✅ ${pkg} installed`);
    }
  });
}

console.log();

// 6. Check Prisma schema
console.log('6️⃣  Checking Prisma schema...');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  warnings.push('⚠️  prisma/schema.prisma not found');
} else {
  console.log('   ✅ schema.prisma exists');
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const requiredModels = ['User', 'Account', 'Session'];
  
  requiredModels.forEach(model => {
    if (!schemaContent.includes(`model ${model}`)) {
      issues.push(`❌ Missing ${model} model in schema.prisma`);
    } else {
      console.log(`   ✅ ${model} model found`);
    }
  });
}

console.log();

// Print summary
console.log('═'.repeat(50));
console.log('📊 SUMMARY\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Your setup looks good.\n');
  console.log('If you\'re still having issues:');
  console.log('1. Make sure your dev server is running on the correct port');
  console.log('2. Verify Google Console callback URL matches NEXTAUTH_URL');
  console.log('3. Check browser console for errors');
  console.log('4. Try clearing browser cookies and cache');
} else {
  if (issues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:\n');
    issues.forEach(issue => console.log(issue));
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(warning => console.log(warning));
    console.log();
  }
  
  console.log('📝 NEXT STEPS:');
  console.log('1. Fix all critical issues above');
  console.log('2. Run: npm install');
  console.log('3. Run: npx prisma generate');
  console.log('4. Restart your dev server');
}

console.log('═'.repeat(50));
