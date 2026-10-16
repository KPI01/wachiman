const port = Number(process.env.PORT || 3000);
const response = await fetch(`http://127.0.0.1:${port}/`);
process.exit(response.ok ? 0 : 1);
