const { exec } = require("child_process");
const fs = require("fs");
const out = fs.createWriteStream("dev_output.txt");

const p = exec("npm run dev", { env: process.env }, (err, stdout, stderr) => {
  if (err) {
    out.write(`ERROR:\n${err.stack || err}\n`);
  }
  if (stdout) out.write(`STDOUT:\n${stdout}\n`);
  if (stderr) out.write(`STDERR:\n${stderr}\n`);
  out.end();
});

p.stdout && p.stdout.pipe(out);
p.stderr && p.stderr.pipe(out);

p.on("exit", (code) => {
  out.write(`\nPROCESS_EXIT_CODE: ${code}\n`);
});
