function u(n,s){if(n.length===0)return;const t=Object.keys(n[0]),r=[t.join(","),...n.map(i=>t.map(a=>{const d=i[a]??"",e=String(d).replace(/"/g,'""');return e.includes(",")||e.includes('"')||e.includes(`
`)?`"${e}"`:e}).join(","))],l=new Blob([r.join(`
`)],{type:"text/csv"}),o=URL.createObjectURL(l),c=document.createElement("a");c.href=o,c.download=s,c.click(),URL.revokeObjectURL(o)}export{u as d};
