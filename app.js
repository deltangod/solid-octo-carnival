/* Ankara Baddies storefront. See README.md for backend setup. */
const CONFIG = {
  supabaseUrl: "https://eleodjpifottzucbqkat.supabase.co",       // e.g. https://YOUR_PROJECT.supabase.co
  supabaseAnonKey: "sb_publishable_iZwJFxc2k8sH7WcGF1Riyg_Z_sz1EJH"    // Supabase publishable/anon key only; never put service_role here
};
// When both values above are set the site runs in LIVE mode (real products, accounts, orders,
// bank-transfer checkout via Netlify Functions). When empty it runs in browser-only DEMO mode.

const productsSeed = [
  {id:"ab-001",name:"The Zuri Midi",category:"Dresses",price:38500,badge:"Bestseller",description:"A statement midi with a flattering waist.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:1},
  {id:"ab-002",name:"The Kente Muse Set",category:"Sets",price:52000,badge:"New drop",description:"A coordinated two-piece with big energy.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:2},
  {id:"ab-003",name:"Olive Bloom Dress",category:"Dresses",price:42000,badge:"Limited",description:"A soft silhouette with a bold print.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:3},
  {id:"ab-004",name:"The Amara Top",category:"Tops",price:22000,badge:"Easy favourite",description:"The top that makes simple plans feel special.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:4},
  {id:"ab-005",name:"Sunday Best Set",category:"Sets",price:48500,badge:"Baddie pick",description:"A playful set made for being seen.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:5},
  {id:"ab-006",name:"Sunset Wrap Dress",category:"Dresses",price:39500,badge:"Just landed",description:"Wrap, tie, and make the entrance.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:6},
  {id:"ab-007",name:"The Lagos Blouse",category:"Tops",price:19500,badge:"Everyday luxe",description:"An Ankara staple with a polished finish.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:7},
  {id:"ab-008",name:"Pink Pepper Co-ord",category:"Sets",price:55000,badge:"Statement",description:"For days when blending in is not the assignment.",sizes:["XS","S","M","L","XL","XXL"],image:"",art:8}
];
let products = loadJSON("ab_products", productsSeed);
let cart = loadJSON("ab_cart", []);
let selectedCategory = "All";
let sb = null;          // Supabase client (live mode)
let sessionUser = null;
let toastTimer;

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const naira = n => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n)||0);
function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??structuredClone(fallback)}catch{return structuredClone(fallback)}}
function saveJSON(key,value){localStorage.setItem(key,JSON.stringify(value))}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800)}
function initSupabase(){if(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase){sb=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey)}}
function productVisual(p){if(p.image)return `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'">`;return `<div class="product-art art-${p.art||1}"><span class="art-flower">â¿</span><small>ANKARA BADDIES</small></div>`}
function renderProducts(){
  const grid=$("#productGrid");let shown=products.filter(p=>selectedCategory==="All"||p.category===selectedCategory);
  const sort=$("#sortSelect").value;if(sort==="low")shown.sort((a,b)=>a.price-b.price);if(sort==="high")shown.sort((a,b)=>b.price-a.price);
  grid.innerHTML=shown.map(p=>`<article class="product-card"><div class="product-image">${productVisual(p)}<span class="product-tag">${escapeHTML(p.badge||"Made with love")}</span><button class="quick-add" data-add="${escapeHTML(p.id)}">Choose size & add +</button></div><div class="product-info"><div class="product-info-top"><div><h3>${escapeHTML(p.name)}</h3><span class="category">${escapeHTML(p.category)}</span></div><span class="price">${naira(p.price)}</span></div><div class="product-rating">â¦ ${escapeHTML(p.description||"An Ankara Baddies original")}</div></div></article>`).join("");
  $("#emptyProducts").hidden=shown.length>0;
}
function openOverlay(){ $("#overlay").classList.add("open"); }
function closeAll(){ $("#overlay").classList.remove("open");$("#cartDrawer").classList.remove("open");$("#cartDrawer").setAttribute("aria-hidden","true");$$(".modal-wrap").forEach(m=>m.classList.remove("open")); }
function openCart(){closeAll();openOverlay();$("#cartDrawer").classList.add("open");$("#cartDrawer").setAttribute("aria-hidden","false");renderCart()}
function openModal(id){closeAll();$("#"+id).classList.add("open");openOverlay();const input=$("#"+id+" input");if(input)setTimeout(()=>input.focus(),80)}
function addToCart(id,size){
  const p=products.find(x=>x.id===id);if(!p)return;
  const existing=cart.find(x=>x.id===id&&x.size===size);
  if(existing)existing.qty++;else cart.push({id:p.id,name:p.name,price:p.price,size,qty:1,art:p.art,image:p.image});
  saveJSON("ab_cart",cart);renderCart();notify(`${p.name} added to your bag â¿`);
}
function renderCart(){
  $("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);$("#drawerCount").textContent=`(${cart.reduce((n,x)=>n+x.qty,0)})`;
  $("#cartSubtotal").textContent=naira(cart.reduce((n,x)=>n+x.price*x.qty,0));
  $("#cartItems").innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><div class="cart-thumb">${x.image?`<img src="${escapeHTML(x.image)}" alt="" style="width:100%;height:100%;object-fit:cover">`:"â¿"}</div><div><h3>${escapeHTML(x.name)}</h3><p>Size: ${escapeHTML(x.size)} Â· ${naira(x.price)}</p><div class="qty-control"><button data-qty="${i}" data-delta="-1" aria-label="Decrease quantity">â</button><span>${x.qty}</span><button data-qty="${i}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove-item" data-remove="${i}">Remove</button></div></div><strong style="font-size:11px">${naira(x.price*x.qty)}</strong></div>`).join(""):`<div style="text-align:center;padding:70px 10px;color:var(--muted)"><div style="font-size:42px;color:var(--rose)">â¡</div><h3 style="font:22px var(--serif);color:var(--ink)">Your bag is taking a nap.</h3><p style="font-size:11px;line-height:1.7">Find a print that feels like you and bring it here.</p></div>`;
}
function adminMode(){return new URLSearchParams(location.search).get("admin")==="1"}
function renderDemoAdmin(){
  document.body.innerHTML=`<div class="announcement">ANKARA BADDIES Â· STORE ADMIN</div><header class="site-header"><a class="brand" href="./"><span class="brand-mark">AB</span><span class="brand-name">ANKARA <i>BADDIES</i></span></a><a class="text-link" href="./">â View storefront</a></header><main class="section-wrap"><p class="eyebrow">ATELIER CONTROL ROOM</p><h1 style="font:600 48px var(--serif)">Manage your <em style="color:var(--rose)">collection.</em></h1><p class="muted">Demo admin stores changes in this browser only. Connect Supabase and add server-side role checks before using this for a real shop.</p><div class="admin-panel" style="margin-top:30px;background:white;border:1px solid var(--line);padding:24px"><h2 style="font:28px var(--serif)">Add a product</h2><form id="adminProductForm" class="form-stack"><div class="form-two"><label>Product name<input name="name" required></label><label>Price in NGN<input name="price" type="number" min="1" required></label></div><div class="form-two"><label>Category<select name="category"><option>Dresses</option><option>Sets</option><option>Tops</option><option>Other</option></select></label><label>Badge<input name="badge" placeholder="New drop"></label></div><label>Product image URL<input name="image" type="url" placeholder="https://..."></label><label>Description<textarea name="description" rows="2"></textarea></label><button class="button button-dark" type="submit">Add product +</button></form></div><div class="admin-panel" style="margin-top:25px;background:white;border:1px solid var(--line);padding:24px"><h2 style="font:28px var(--serif)">Current products <span id="adminProductCount"></span></h2><div id="adminProductList"></div></div><div class="admin-panel" style="margin-top:25px;background:white;border:1px solid var(--line);padding:24px"><h2 style="font:28px var(--serif)">Demo orders & custom requests</h2><p class="muted">Orders are stored in this browser until a backend is connected.</p><div id="adminOrders"></div></div></main>`;
  const list=()=>{$("#adminProductCount").textContent=`(${products.length})`;$("#adminProductList").innerHTML=products.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--line);padding:14px 0"><div><strong>${escapeHTML(p.name)}</strong><div class="muted">${escapeHTML(p.category)} Â· ${naira(p.price)}</div></div><button class="filter-pill" data-delete-product="${escapeHTML(p.id)}">Delete</button></div>`).join("");const orders=loadJSON("ab_orders",[]);$("#adminOrders").innerHTML=orders.length?orders.map(o=>`<div style="border-top:1px solid var(--line);padding:14px 0"><strong>${escapeHTML(o.type)} Â· ${escapeHTML(o.name||"Customer")}</strong><p class="muted">${escapeHTML(o.email||"")} Â· ${escapeHTML(o.status||"Pending")} Â· ${naira(o.total||0)}</p><small>${escapeHTML(o.summary||o.description||"")}</small></div>`).join(""):"<p class='muted'>No demo orders yet.</p>"};
  list();$("#adminProductForm").addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));products.unshift({id:"ab-"+Date.now(),name:d.name,price:Number(d.price),category:d.category,badge:d.badge||"New",description:d.description||"An Ankara Baddies original",sizes:["XS","S","M","L","XL","XXL"],image:d.image,art:(products.length%8)+1});saveJSON("ab_products",products);e.target.reset();list();notify("Product added in this browser.");});
  $("#adminProductList").addEventListener("click",e=>{const b=e.target.closest("[data-delete-product]");if(!b)return;products=products.filter(p=>p.id!==b.dataset.deleteProduct);saveJSON("ab_products",products);list()});
}
document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");if(add){const p=products.find(x=>x.id===add.dataset.add);if(!p)return;const size=prompt(`Choose a size for ${p.name}: ${p.sizes.join(", ")}`);if(!size)return;const normalized=size.trim().toUpperCase();if(!p.sizes.includes(normalized)){notify("Please choose one of the listed sizes.");return}addToCart(p.id,normalized);return}
  const qty=e.target.closest("[data-qty]");if(qty){const i=Number(qty.dataset.qty);cart[i].qty+=Number(qty.dataset.delta);if(cart[i].qty<=0)cart.splice(i,1);saveJSON("ab_cart",cart);renderCart();return}
  const remove=e.target.closest("[data-remove]");if(remove){cart.splice(Number(remove.dataset.remove),1);saveJSON("ab_cart",cart);renderCart();return}
  const filter=e.target.closest("[data-category]");if(filter){selectedCategory=filter.dataset.category;$$(".filter-pill[data-category]").forEach(x=>x.classList.toggle("active",x===filter));renderProducts()}
  if(e.target.closest("[data-close]")||e.target.id==="overlay")closeAll();
});
$("#sortSelect").addEventListener("change",renderProducts);
$("#cartButton").addEventListener("click",openCart);
$("#accountButton").addEventListener("click",async()=>{await refreshAccount();openModal("accountModal")});
$("#customOrderButton").addEventListener("click",()=>openModal("customModal"));
$("#checkoutButton").addEventListener("click",()=>{if(!cart.length){notify("Your bag is empty.");return}$("#checkoutTotal").textContent=naira(cart.reduce((n,x)=>n+x.price*x.qty,0));openModal("checkoutModal")});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$(".main-nav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAll()});

/* ---------- Live-mode helpers ---------- */
const FN = "/.netlify/functions/";
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function authHeaders() {
  const h = { "Content-Type": "application/json" };
  if (sb) { const { data } = await sb.auth.getSession(); if (data.session) h.Authorization = `Bearer ${data.session.access_token}`; }
  return h;
}
async function callFn(name, payload) {
  const res = await fetch(FN + name, { method: "POST", headers: await authHeaders(), body: JSON.stringify(payload) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || "Something went wrong. Please try again.");
  return out;
}
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

async function loadProducts() {
  const { data, error } = await sb.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
  if (error) { console.error(error); notify("Couldn't load products. Please refresh."); products = []; return; }
  products = data.map((p, i) => ({
    id: p.id, name: p.name, category: p.category, price: p.price_ngn, badge: p.badge,
    description: p.description, sizes: p.sizes, image: p.image_url || "", art: (i % 8) + 1
  }));
}
// Drop bag items that no longer exist and refresh names/prices from the catalogue.
function syncCart() {
  cart = cart.filter(x => products.some(p => p.id === x.id)).map(x => {
    const p = products.find(p => p.id === x.id); return { ...x, name: p.name, price: p.price, image: p.image };
  });
  saveJSON("ab_cart", cart); renderCart();
}

/* ---------- Account ---------- */
function applyAccountUI(user) {
  sessionUser = user || null;
  const signedIn = !!sessionUser;
  $("#accountForm").hidden = signedIn; $("#signedInBox").hidden = !signedIn;
  if (signedIn) $("#signedInEmail").textContent = sessionUser.email;
  $("#accountButton span").textContent = signedIn ? "Me" : "Account";
}
async function refreshAccount() {
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  applyAccountUI(data.session ? data.session.user : null);
}
$("#accountForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#accountEmail").value.trim(), password = $("#accountPassword").value, msg = $("#accountMessage");
  if (!sb) { msg.textContent = `Demo account ready for ${email}. Configure Supabase to enable secure accounts.`; saveJSON("ab_demo_user", { email }); return; }
  msg.textContent = "One momentâ¦";
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (!error) { await refreshAccount(); msg.textContent = ""; notify("Signed in â¿"); setTimeout(closeAll, 600); return; }
  if (/invalid login/i.test(error.message)) {
    const up = await sb.auth.signUp({ email, password });
    msg.textContent = up.error ? up.error.message : "If this email is new, check your inbox to confirm your account. Already registered? Please check your password.";
  } else if (/confirm/i.test(error.message)) msg.textContent = "Please confirm your email first. Check your inbox.";
  else msg.textContent = error.message;
});
$("#signOutButton").addEventListener("click", async () => { await sb.auth.signOut(); await refreshAccount(); notify("Signed out."); });

/* ---------- Custom orders ---------- */
$("#customForm").addEventListener("submit", async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), msg = $("#customMessage"), btn = e.target.querySelector("[type=submit]");
  if (sb) {
    btn.disabled = true; msg.textContent = "Sending your requestâ¦";
    try { await callFn("submit-custom-order", d); }
    catch (err) { msg.textContent = err.message; btn.disabled = false; return; }
    btn.disabled = false;
  } else {
    const orders = loadJSON("ab_orders", []);
    orders.unshift({ type: "Custom request", name: d.name, email: d.email, total: 0, status: "Quote needed", summary: `${d.garment} Â· ${d.size} Â· ${d.destination}`, description: d.description, created_at: new Date().toISOString() });
    saveJSON("ab_orders", orders);
  }
  msg.textContent = "Request received. We'll confirm a quote before any payment.";
  e.target.reset(); notify("Custom request submitted â¿"); setTimeout(closeAll, 1200);
});

/* ---------- Payment settings (bank transfer + WhatsApp) ---------- */
let settings = { bank_name: "Your Bank", account_number: "0000000000", account_name: "Ankara Baddies", whatsapp_number: "", payment_note: "Use your order reference as the transfer narration." };
async function loadSettings() {
  if (!sb) return;
  const { data } = await sb.from("site_settings").select("key,value");
  (data || []).forEach(r => { settings[r.key] = r.value; });
}
const lastOrder = () => loadJSON("ab_last_order", null);
function showPaymentInstructions(o) {
  const msg = encodeURIComponent(`Hello Ankara Baddies! I've paid ${naira(o.total)} for order ${o.reference}. Name: ${o.name}. Proof of payment attached.`);
  const wa = settings.whatsapp_number ? `https://wa.me/${encodeURIComponent(settings.whatsapp_number)}?text=${msg}` : "";
  const row = (k, v, copy) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line)"><span class="muted">${k}</span><span><strong>${escapeHTML(v)}</strong>${copy ? ` <button type="button" class="filter-pill" data-copy="${escapeHTML(v)}">Copy</button>` : ""}</span></div>`;
  $("#checkoutForm").hidden = true; $("#checkoutHead").hidden = true;
  const box = $("#paymentInstructions"); box.hidden = false;
  box.innerHTML = `<p class="eyebrow">ORDER PLACED â¿</p><h2>Almost there, <em>${escapeHTML(o.name.split(" ")[0])}.</em></h2>
    <p class="muted">Please transfer exactly <strong>${naira(o.total)}</strong> to the account below, then send us your proof of payment on WhatsApp.</p>
    <div style="margin:16px 0">${row("Bank", settings.bank_name)}${row("Account number", settings.account_number, true)}${row("Account name", settings.account_name)}${row("Order reference", o.reference, true)}${row("Amount", naira(o.total))}</div>
    ${settings.payment_note ? `<p class="form-note">${escapeHTML(settings.payment_note)}</p>` : ""}
    ${wa ? `<a class="button button-dark full-width" href="${wa}" target="_blank" rel="noopener noreferrer">Send proof on WhatsApp â</a>` : `<p class="form-note"><strong>Send your proof of payment with reference ${escapeHTML(o.reference)} to us on WhatsApp.</strong></p>`}
    <p class="form-note">We'll confirm your payment and start on your order as soon as we see it.</p>
    <button type="button" class="text-link" id="payDone" style="margin-top:10px">I've sent my proof</button>`;
  openModal("checkoutModal");
}
function resetCheckoutView() { $("#checkoutForm").hidden = false; $("#checkoutHead").hidden = false; $("#paymentInstructions").hidden = true; $("#checkoutForm [type=submit]").disabled = false; }
function renderLastOrderLink() { const o = lastOrder(), el = $("#lastOrderLink"); el.hidden = !o; if (o) el.textContent = `View payment details for order ${o.reference}`; }
$("#lastOrderLink").addEventListener("click", () => { const o = lastOrder(); if (o) showPaymentInstructions(o); });
document.addEventListener("click", e => {
  const c = e.target.closest("[data-copy]");
  if (c) { navigator.clipboard && navigator.clipboard.writeText(c.dataset.copy).then(() => notify("Copied â¿")).catch(() => {}); }
  if (e.target.closest("#payDone")) { localStorage.removeItem("ab_last_order"); renderLastOrderLink(); closeAll(); notify("Thank you! We'll confirm shortly â¿"); }
});
$("#checkoutButton").addEventListener("click", () => resetCheckoutView());

/* ---------- Checkout ---------- */
$("#checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), msg = $("#checkoutMessage"), btn = e.target.querySelector("[type=submit]");
  const total = cart.reduce((n, x) => n + x.price * x.qty, 0);
  let order;
  if (sb) {
    btn.disabled = true; msg.textContent = "Creating your orderâ¦";
    try { order = await callFn("create-order", { ...d, items: cart.map(x => ({ id: x.id, size: x.size, qty: x.qty })) }); }
    catch (err) { msg.textContent = err.message; btn.disabled = false; return; }
  } else {
    const orders = loadJSON("ab_orders", []);
    order = { reference: "AB-DEMO" + Math.floor(Math.random() * 9000 + 1000), total, name: d.name };
    orders.unshift({ type: "Ready-to-wear", name: d.name, email: d.email, total, status: "Awaiting payment", summary: cart.map(x => `${x.name} (${x.size}) Ã ${x.qty}`).join(", "), items: cart, created_at: new Date().toISOString() });
    saveJSON("ab_orders", orders);
  }
  saveJSON("ab_last_order", { reference: order.reference, total: order.total, name: order.name });
  cart = []; saveJSON("ab_cart", cart); renderCart(); renderLastOrderLink(); e.target.reset();
  btn.disabled = false; msg.textContent = "";
  showPaymentInstructions({ reference: order.reference, total: order.total, name: order.name });
});

/* ---------- Newsletter ---------- */
$("#newsletterForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#newsletterEmail").value.trim(), msg = $("#newsletterMessage");
  if (sb) {
    try { await callFn("subscribe", { email }); } catch (err) { msg.textContent = err.message; return; }
  } else { const list = loadJSON("ab_newsletter", []); if (!list.includes(email)) list.push(email); saveJSON("ab_newsletter", list); }
  msg.textContent = "You're on the list. Expect lovely things â¿"; e.target.reset();
});

/* ---------- Secure admin (live mode) ---------- */
const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const CUSTOM_STATUSES = ["quote_needed", "awaiting_payment", "paid", "in_production", "shipped", "completed", "cancelled"];
const label = s => s.replace(/_/g, " ");
const when = d => new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const opts = (list, cur) => list.map(s => `<option value="${s}" ${s === cur ? "selected" : ""}>${label(s)}</option>`).join("");

function adminShell(inner, signOut = false) {
  document.body.innerHTML = `<style>.ad-card{margin-top:25px;background:#fff;border:1px solid var(--line);padding:24px}.ad-card h2{font:28px var(--serif);margin-bottom:6px}.ad-row{border-top:1px solid var(--line);padding:14px 0;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center}.ad-row small{display:block;color:var(--muted);line-height:1.6}.ad-row select,.ad-row input{padding:8px;border:1px solid var(--line);font:inherit}.ad-img{width:54px;height:54px;object-fit:cover;background:var(--blush,#f7e6e4)}</style>
  <div class="announcement">ANKARA BADDIES Â· STORE ADMIN</div><header class="site-header"><a class="brand" href="./"><span class="brand-mark">AB</span><span class="brand-name">ANKARA <i>BADDIES</i></span></a><div><a class="text-link" href="./">â Storefront</a>${signOut ? ' &nbsp; <button class="filter-pill" id="adminSignOut">Sign out</button>' : ""}</div></header><main class="section-wrap">${inner}</main>`;
  if (signOut) $("#adminSignOut").onclick = async () => { await sb.auth.signOut(); renderAdmin(); };
}
async function renderAdmin() {
  if (!sb) return renderDemoAdmin();
  const { data } = await sb.auth.getSession();
  if (!data.session) return adminLogin();
  const { data: prof } = await sb.from("profiles").select("is_admin").eq("id", data.session.user.id).maybeSingle();
  if (!prof || !prof.is_admin) {
    adminShell(`<h1 style="font:600 40px var(--serif)">Not authorised</h1><p class="muted">${escapeHTML(data.session.user.email)} isn't an admin account.</p>`, true); return;
  }
  adminDashboard();
}
function adminLogin() {
  adminShell(`<p class="eyebrow">ADMIN SIGN IN</p><h1 style="font:600 40px var(--serif)">Welcome back.</h1><form id="adminLogin" class="form-stack" style="max-width:380px;margin-top:20px"><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" required></label><button class="button button-dark" type="submit">Sign in</button><p class="form-note" id="adminLoginMsg"></p></form>`);
  $("#adminLogin").onsubmit = async e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const { error } = await sb.auth.signInWithPassword(f);
    if (error) $("#adminLoginMsg").textContent = error.message; else renderAdmin();
  };
}
async function adminDashboard() {
  adminShell(`<p class="eyebrow">ATELIER CONTROL ROOM</p><h1 style="font:600 44px var(--serif)">Manage your <em style="color:var(--rose)">shop.</em></h1>
  <div class="ad-card"><h2>Payment details</h2><p class="muted">Shown to customers after they place an order. WhatsApp number: country code, digits only (e.g. 2348012345678).</p><form id="adSettingsForm" class="form-stack"><div class="form-two"><label>Bank name<input name="bank_name" required></label><label>Account number<input name="account_number" inputmode="numeric" required></label></div><div class="form-two"><label>Account name<input name="account_name" required></label><label>WhatsApp number<input name="whatsapp_number" inputmode="numeric" placeholder="2348012345678"></label></div><label>Note to customers (optional)<textarea name="payment_note" rows="2"></textarea></label><button class="button button-dark" type="submit">Save payment details</button><p class="form-note" id="adSettingsMsg"></p></form></div>
  <div class="ad-card"><h2>Add a product</h2><form id="adProductForm" class="form-stack"><div class="form-two"><label>Product name<input name="name" required></label><label>Price (NGN)<input name="price" type="number" min="1" step="1" required></label></div><div class="form-two"><label>Category<select name="category"><option>Dresses</option><option>Sets</option><option>Tops</option><option>Other</option></select></label><label>Badge<input name="badge" placeholder="New drop"></label></div><label>Product photo<input name="photo" type="file" accept="image/*"></label><label>Description<textarea name="description" rows="2"></textarea></label><button class="button button-dark" type="submit">Add product +</button><p class="form-note" id="adProductMsg"></p></form></div>
  <div class="ad-card"><h2>Products <span id="adProdCount"></span></h2><div id="adProducts">Loadingâ¦</div></div>
  <div class="ad-card"><h2>Orders</h2><p class="muted">When a customer sends proof on WhatsApp, match the reference and change the order to âpaidâ.</p><div id="adOrders">Loadingâ¦</div></div>
  <div class="ad-card"><h2>Custom requests</h2><p class="muted">Set the quote, then email the customer. Payment for custom pieces isn't automated yet.</p><div id="adCustom">Loadingâ¦</div></div>
  <div class="ad-card"><h2>Newsletter subscribers <span id="adSubCount"></span></h2><p class="muted" id="adSubs"></p></div>`, true);

  const msg = t => { const m = $("#adProductMsg"); if (m) m.textContent = t; };
  async function loadProductsAdmin() {
    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
    if (error) { $("#adProducts").textContent = error.message; return; }
    $("#adProdCount").textContent = `(${data.length})`;
    $("#adProducts").innerHTML = data.map(p => `<div class="ad-row"><div style="display:flex;gap:12px;align-items:center">${p.image_url ? `<img class="ad-img" src="${escapeHTML(p.image_url)}" alt="">` : '<div class="ad-img"></div>'}<div><strong>${escapeHTML(p.name)}</strong>${p.active ? "" : " <em>(hidden)</em>"}<small>${escapeHTML(p.category)} Â· ${naira(p.price_ngn)}</small></div></div><div><button class="filter-pill" data-price="${p.id}" data-cur="${p.price_ngn}">Price</button> <button class="filter-pill" data-toggle="${p.id}" data-active="${p.active}">${p.active ? "Hide" : "Show"}</button> <button class="filter-pill" data-del="${p.id}">Delete</button></div></div>`).join("") || "<p class='muted'>No products yet.</p>";
  }
  async function loadOrdersAdmin() {
    const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) { $("#adOrders").textContent = error.message; return; }
    $("#adOrders").innerHTML = data.map(o => `<div class="ad-row"><div><strong>${escapeHTML(o.payment_reference || "")}</strong> Â· ${escapeHTML(o.customer_name)} Â· ${naira(o.total_amount)}<small>${escapeHTML(o.email)} Â· ${escapeHTML(o.phone || "")}<br>${escapeHTML(o.shipping_address)}, ${escapeHTML(o.country)}<br>${(o.items || []).map(i => `${escapeHTML(i.name)} (${escapeHTML(i.size)}) Ã ${Number(i.qty)}`).join(", ")}${o.notes ? `<br>Note: ${escapeHTML(o.notes)}` : ""}<br>${when(o.created_at)}</small></div><select data-order="${o.id}">${opts(ORDER_STATUSES, o.status)}</select></div>`).join("") || "<p class='muted'>No orders yet.</p>";
  }
  async function loadCustomAdmin() {
    const { data, error } = await sb.from("custom_orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) { $("#adCustom").textContent = error.message; return; }
    $("#adCustom").innerHTML = data.map(c => `<div class="ad-row"><div style="max-width:520px"><strong>${escapeHTML(c.customer_name)}</strong> Â· ${escapeHTML(c.garment)} Â· ${escapeHTML(c.size)}<small>${escapeHTML(c.email)} Â· ${escapeHTML(c.destination)}<br>${escapeHTML(c.description)}${c.measurements ? `<br>Measurements: ${escapeHTML(c.measurements)}` : ""}${c.reference_url ? `<br><a href="${escapeHTML(c.reference_url)}" target="_blank" rel="noopener noreferrer">Reference link</a>` : ""}<br>${when(c.created_at)}</small></div><div data-custom-row="${c.id}"><input type="number" min="0" placeholder="Quote â¦" value="${c.quoted_amount ?? ""}" style="width:110px"> <select>${opts(CUSTOM_STATUSES, c.status)}</select> <button class="filter-pill" data-save-custom="${c.id}">Save</button></div></div>`).join("") || "<p class='muted'>No custom requests yet.</p>";
  }
  async function loadSubs() {
    const { data } = await sb.from("newsletter_subscribers").select("email").order("created_at", { ascending: false });
    $("#adSubCount").textContent = `(${(data || []).length})`; $("#adSubs").textContent = (data || []).map(s => s.email).join(", ") || "None yet.";
  }

  $("#adProductForm").onsubmit = async e => {
    e.preventDefault(); const form = e.target, d = Object.fromEntries(new FormData(form)), btn = form.querySelector("[type=submit]");
    btn.disabled = true; msg("Savingâ¦");
    try {
      let image_url = null; const file = form.photo.files[0];
      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await sb.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (up.error) throw up.error;
        image_url = sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await sb.from("products").insert({ name: d.name.trim(), slug: slugify(d.name) + "-" + Math.random().toString(36).slice(2, 6), description: d.description.trim() || null, category: d.category, price_ngn: Math.round(Number(d.price)), badge: d.badge.trim() || null, image_url });
      if (error) throw error;
      form.reset(); msg("Product added â¿"); loadProductsAdmin();
    } catch (err) { msg(err.message || "Could not save product."); }
    btn.disabled = false;
  };
  $("#adProducts").onclick = async e => {
    const price = e.target.closest("[data-price]"), tog = e.target.closest("[data-toggle]"), del = e.target.closest("[data-del]");
    if (price) { const v = prompt("New price in NGN:", price.dataset.cur); const n = Math.round(Number(v)); if (!v || !(n > 0)) return; const { error } = await sb.from("products").update({ price_ngn: n }).eq("id", price.dataset.price); if (error) notify(error.message); loadProductsAdmin(); }
    if (tog) { const { error } = await sb.from("products").update({ active: tog.dataset.active !== "true" }).eq("id", tog.dataset.toggle); if (error) notify(error.message); loadProductsAdmin(); }
    if (del) { if (!confirm("Delete this product permanently? (Hide keeps it for later.)")) return; const { error } = await sb.from("products").delete().eq("id", del.dataset.del); if (error) notify(error.message); loadProductsAdmin(); }
  };
  $("#adOrders").onchange = async e => {
    const sel = e.target.closest("[data-order]"); if (!sel) return;
    const { error } = await sb.from("orders").update({ status: sel.value }).eq("id", sel.dataset.order); notify(error ? error.message : "Order updated â¿");
  };
  $("#adCustom").onclick = async e => {
    const b = e.target.closest("[data-save-custom]"); if (!b) return;
    const row = b.closest("[data-custom-row]"), q = row.querySelector("input").value;
    const { error } = await sb.from("custom_orders").update({ quoted_amount: q === "" ? null : Math.round(Number(q)), status: row.querySelector("select").value }).eq("id", b.dataset.saveCustom);
    notify(error ? error.message : "Saved â¿");
  };
  const sf = $("#adSettingsForm");
  sb.from("site_settings").select("key,value").then(({ data }) => (data || []).forEach(r => { if (sf.elements[r.key]) sf.elements[r.key].value = r.value; }));
  sf.onsubmit = async e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(sf));
    let wa = (d.whatsapp_number || "").replace(/\D/g, ""); if (/^0\d{10}$/.test(wa)) wa = "234" + wa.slice(1); // 0801... -> 234801...
    d.whatsapp_number = wa; sf.elements.whatsapp_number.value = wa;
    const rows = Object.entries(d).map(([key, value]) => ({ key, value: String(value).trim(), updated_at: new Date().toISOString() }));
    const { error } = await sb.from("site_settings").upsert(rows, { onConflict: "key" });
    $("#adSettingsMsg").textContent = error ? error.message : "Saved â¿ Customers will see this at checkout.";
  };
  loadProductsAdmin(); loadOrdersAdmin(); loadCustomAdmin(); loadSubs();
}

/* ---------- Boot ---------- */
async function boot() {
  if (!sb) $("#accountMessage").textContent = (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) ? "Could not connect to Supabase. Please refresh, or check the script in index.html." : "Demo mode is active until Supabase is configured.";
  renderCart();
  if (sb) { await Promise.all([loadProducts(), loadSettings()]); syncCart(); sb.auth.onAuthStateChange((_event, session) => { applyAccountUI(session ? session.user : null); }); }
  renderProducts();
  renderLastOrderLink();
}
$("#year").textContent = new Date().getFullYear();
initSupabase();
if (adminMode()) renderAdmin(); else boot();
