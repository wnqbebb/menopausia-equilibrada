import { BlobsServer } from "@netlify/blobs/server";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import crypto from "node:crypto";
const F=new URL("../netlify/functions/",import.meta.url).pathname;//"/netlify/functions/";
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"blobs-"));
const token="tok", port=8971;
const server=new BlobsServer({directory:dir,token,port}); await server.start();
const ctx={edgeURL:`http://localhost:${port}`,uncachedEdgeURL:`http://localhost:${port}`,siteID:"site1",token};
process.env.NETLIFY_BLOBS_CONTEXT=Buffer.from(JSON.stringify(ctx)).toString("base64");
const KEY="testkey_"+crypto.randomBytes(6).toString("hex");
process.env.ADMIN_KEY=KEY; process.env.PUBLIC_URL="https://x.test"; process.env.WHOP_WEBHOOK_SECRET="ws_abc";
const imp=async n=>(await import(F+n+".mjs")).default;
const checkout=await imp("checkout"),pedidos=await imp("pedidos"),entrega=await imp("entrega"),acceso=await imp("acceso"),sync=await imp("sync"),oferta=await imp("oferta"),wh=await imp("whop-webhook");
const J=(u,m="GET",b,h={})=>new Request("https://x.test"+u,{method:m,headers:{"content-type":"application/json",...h},body:b?JSON.stringify(b):undefined});
const rj=async r=>{const t=await r.text();try{return {s:r.status,d:JSON.parse(t)}}catch{return {s:r.status,d:t}}};
let t0=Date.now(); const N=+process.argv[2]||1000;
const of=await rj(await oferta(J("/api/oferta","POST",{})));
const ids=[]; const combos=[["todo"],["k1"],["pausa","guia"],["app"],["k1","k2","k3"]];
const conc=40; let i=0, errs=0;
await Promise.all(Array.from({length:conc},async()=>{while(i<N){const n=i++;const r=await rj(await checkout(J("/api/checkout","POST",{name:"Cliente "+n,email:`c${n}@ej.com`,items:combos[n%5],offer:n%2?of.d.token:""})));if(r.s!==200){errs++;if(errs<3)console.log(r)}else ids[n]=r.d;}}));
console.log(`checkouts ${N} en ${Date.now()-t0}ms, errores ${errs}`);
console.log("precios ejemplo", ids.slice(0,5).map(x=>x.items.join("+")+"="+x.cents));
const H={"x-admin-key":KEY};
t0=Date.now(); let r=await rj(await pedidos(J("/api/pedidos?page=0&size=100","GET",null,H))); console.log("panel pag1", r.s, r.d.total, r.d.pedidos.length, r.d.pages, (Date.now()-t0)+"ms", "orden ok:", r.d.pedidos[0].createdAt>=r.d.pedidos[99].createdAt);
// mark half paid via webhook
t0=Date.now(); let ok=0;
for(let n=0;n<N;n+=2){const body=JSON.stringify({type:"payment.succeeded",data:{id:"pay_"+n,usd_total:{amount:(ids[n].cents/100).toFixed(2)},metadata:{pedido:ids[n].id}}});const id="m"+n,ts=String(Math.floor(Date.now()/1000));const sig=crypto.createHmac("sha256","ws_abc").update(`${id}.${ts}.${body}`).digest("base64");const x=await rj(await wh(new Request("https://x.test/api/whop-webhook",{method:"POST",headers:{"webhook-id":id,"webhook-timestamp":ts,"webhook-signature":"v1,"+sig},body})));if(x.d.status==="pagado")ok++}
console.log("webhooks pagados", ok, (Date.now()-t0)+"ms");
// underpaid
{const n=1;const body=JSON.stringify({type:"payment.succeeded",data:{id:"pay_x",usd_total:{amount:"1.00"},metadata:{pedido:ids[n].id}}});const id="mx",ts=String(Math.floor(Date.now()/1000));const sig=crypto.createHmac("sha256","ws_abc").update(`${id}.${ts}.${body}`).digest("base64");const x=await rj(await wh(new Request("https://x.test/api/whop-webhook",{method:"POST",headers:{"webhook-id":id,"webhook-timestamp":ts,"webhook-signature":"v1,"+sig},body})));console.log("pago incompleto ->",x.d.status)}
t0=Date.now(); r=await rj(await pedidos(J("/api/pedidos?estado=pagado","GET",null,H))); console.log("filtro pagados", r.d.total, (Date.now()-t0)+"ms");
t0=Date.now(); r=await pedidos(J("/api/pedidos?csv=1","GET",null,H)); const csv=await r.text(); console.log("csv filas", csv.split("\n").length-1, (Date.now()-t0)+"ms");
r=await rj(await pedidos(J("/api/pedidos?q=c10@ej.com","GET",null,H))); console.log("busqueda", r.d.total);
// entrega + acceso + sync for paid todo order (n=0)
const p0=ids[0]; const tk=crypto.createHmac("sha256",KEY).update(p0.id).digest("hex").slice(0,32);
r=await rj(await entrega(J(`/api/entrega?pedido=${p0.id}&t=${tk}`))); console.log("entrega", r.d.paid, r.d.files.length, !!r.d.access, !!r.d.t);
r=await rj(await entrega(J(`/api/entrega?pedido=${ids[2].id}&t=${crypto.createHmac("sha256",KEY).update(ids[2].id).digest("hex").slice(0,32)}`))); console.log("entrega k1 pagado", r.d.paid, r.d.files.map(f=>f.url));
r=await rj(await entrega(J(`/api/entrega?pedido=${ids[1].id}&t=bad`))); console.log("entrega token malo", r.s);
const acc=(await rj(await entrega(J(`/api/entrega?pedido=${p0.id}&t=${tk}`)))).d.access;
r=await rj(await acceso(J("/api/acceso","POST",{code:acc}))); console.log("acceso", r.d.ok);
r=await rj(await acceso(J("/api/acceso","POST",{code:ids[3].id+"-0000000000"}))); console.log("acceso falso", r.d.ok);
const sid=crypto.createHash("sha256").update("x").digest("hex");
r=await rj(await sync(J(`/api/sync?id=${sid}`,"PUT",{a:1}))); console.log("sync sin acceso", r.s);
r=await rj(await sync(J(`/api/sync?id=${sid}`,"PUT",{a:1},{"x-me-acc":acc}))); console.log("sync con acceso", r.s);
r=await rj(await sync(J(`/api/sync?id=${sid}`,"GET",null,{"x-me-acc":acc}))); console.log("sync leer", JSON.stringify(r.d));
// upgrade
const k1=ids[2]; const tk1=crypto.createHmac("sha256",KEY).update(k1.id).digest("hex").slice(0,32);
r=await rj(await checkout(J("/api/checkout","POST",{name:"a",email:"a@b.co",items:["todo"],upgradeFrom:k1.id}))); console.log("mejora sin token", r.s);
r=await rj(await checkout(J("/api/checkout","POST",{name:"a",email:"a@b.co",items:["todo"],upgradeFrom:k1.id,upgradeT:tk1}))); console.log("mejora con token", r.s, r.d.cents);
await server.stop(); process.exit(0);
