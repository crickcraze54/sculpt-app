const {execFileSync}=require('node:child_process');const path=require('node:path');
for(const test of ['regression.cjs','acceptance.cjs','flows.cjs','training-flows.cjs','service-worker.cjs','static-checks.cjs'])execFileSync(process.execPath,[path.join(__dirname,test)],{stdio:'inherit',env:process.env});
