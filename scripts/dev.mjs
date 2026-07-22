import { spawn } from "node:child_process";

const args = [
  "./node_modules/@react-router/dev/bin.cjs",
  "dev",
  "--port",
  process.env.PORT || "5173",
  "--strictPort",
];

if (process.env.HOST) {
  args.push("--host", process.env.HOST);
}

const devServer = spawn(process.execPath, args, { stdio: "inherit" });

devServer.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
