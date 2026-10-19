import { createLink, registerClick, getStats, listLinks } from "./services/links.js";

const link = await createLink("https://nodejs.org");

console.log("criado: ", link.slug)

await registerClick(link.id, {userAgent: "debug"})
await registerClick(link.id)

console.log(await getStats(link.slug))
console.log((await listLinks({limit: 3})).items.length, "links na página")

process.exit(0)