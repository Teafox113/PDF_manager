// Run only project-owned synthetic fixtures. No private file inputs are allowed.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
if(process.env.PDF_MANAGER_TEST_PDF)throw Error('Clear PDF_MANAGER_TEST_PDF before release regression.');
const suites=fs.readdirSync(__dirname).filter(n=>/^test_.*\.cjs$/.test(n)).sort();
let failed=0;
for(const suite of suites){
 console.log(`RUN ${process.env.BROWSER_CHANNEL||'chrome'} ${suite}`);
 const r=spawnSync(process.execPath,[path.join(__dirname,suite)],{stdio:'inherit',env:process.env,timeout:240000});
 if(r.status!==0){failed++;console.error(`FAIL ${suite}: ${r.error?.message||r.status}`);}
}
console.log(`RESULT ${suites.length-failed}/${suites.length} suites passed`);
process.exitCode=failed?1:0;
