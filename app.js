/* Ankara Baddies storefront.
   Demo mode works without credentials. Add Supabase and a verified payment provider
   before taking real customer accounts, orders, or payments. */
const CONFIG = {
  supabaseUrl: "",       // e.g. https://YOUR_PROJECT.supabase.co
  supabaseAnonKey: "",   // Supabase publishable/anon key only; never put service_role here
  paystackPublicKey: ""  // public key only; server-side verification is required
};

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
let supabase = null;
let toastTimer;

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const naira = n => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n)||0);
function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??structuredClone(fallback)}catch{return structuredClone(fallback)}}
function saveJSON(key,value){localStorage.setItem(key,JSON.stringify(value))}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800)}
function initSupabase(){if(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase){supabase=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey)}}
function productVisual(p){if(p.image)return `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'">`;return `<div class="product-art art-${p.art||1}"><span class="art-flower">✿</span><small>ANKARA BADDIES</small></div>`}
function renderProducts(){
  const grid=$("#productGrid");let shown=products.filter(p=>selectedCategory==="All"||p.category===selectedCategory);
  const sort=$("#sortSelect").value;if(sort==="low")shown.sort((a,b)=>a.price-b.price);if(sort==="high")shown.sort((a,b)=>b.price-a.price);
  grid.innerHTML=shown.map(p=>`<article class="product-card"><div class="product-image">${productVisual(p)}<span class="product-tag">${escapeHTML(p.badge||"Made with love")}</span><button class="quick-add" data-add="${escapeHTML(p.id)}">Choose size & add +</button></div><div class="product-info"><div class="product-info-top"><div><h3>${escapeHTML(p.name)}</h3><span class="category">${escapeHTML(p.category)}</span></div><span class="price">${naira(p.price)}</span></div><div class="product-rating">✦ ${escapeHTML(p.description||"An Ankara Baddies original")}</div></div></article>`).join("");
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
  saveJSON("ab_cart",cart);renderCart();notify(`${p.name} added to your bag ✿`);
}
function renderCart(){
  $("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);$("#drawerCount").textContent=`(${cart.reduce((n,x)=>n+x.qty,0)})`;
  $("#cartSubtotal").textContent=naira(cart.reduce((n,x)=>n+x.price*x.qty,0));
  $("#cartItems").innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><div class="cart-thumb">${x.image?`<img src="${escapeHTML(x.image)}" alt="" style="width:100%;height:100%;object-fit:cover">`:"✿"}</div><div><h3>${escapeHTML(x.name)}</h3><p>Size: ${escapeHTML(x.size)} · ${naira(x.price)}</p><div class="qty-control"><button data-qty="${i}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${x.qty}</span><button data-qty="${i}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove-item" data-remove="${i}">Remove</button></div></div><strong style="font-size:11px">${naira(x.price*x.qty)}</strong></div>`).join(""):`<div style="text-align:center;padding:70px 10px;color:var(--muted)"><div style="font-size:42px;color:var(--rose)">♡</div><h3 style="font:22px var(--serif);color:var(--ink)">Your bag is taking a nap.</h3><p style="font-size:11px;line-height:1.7">Find a print that feels like you and bring it here.</p></div>`;
}
function adminMode(){return new URLSearchParams(location.search).get("admin")==="1"}
function renderAdmin(){
  document.body.innerHTML=`<div class="announcement">ANKARA BADDIES · STORE ADMIN</div><header class="site-header"><a class="brand" href="./"><span class="brand-mark">AB</span><span class="brand-name">ANKARA <i>BADDIES</i></span></a><a class="text-link" href="./">← View storefront</a></header><main class="section-wrap"><p class="eyebrow">ATELIER CONTROL ROOM</p><h1 style="font:600 48px var(--serif)">Manage your <em style="color:var(--rose)">collection.</em></h1><p class="muted">Demo admin stores changes in this browser only. Connect Supabase and add server-side role checks before using this for a real shop.</p><div class="admin-panel" style="margin-top:30px;background:white;border:1px solid var(--line);padding:24px"><h2 style="font:28px var(--serif)">Add a product</h2><form id="adminProductForm" class="form-stack"><div class="form-two"><label>Product name<input name="name" required></label><label>Price in NGN<input name="price" type="number" min="1" required></label></div><div class="form-two"><label>Category<select name="category"><option>Dresses</option><option>Sets</option><option>Tops</option><option>Other</option></select></label><label>Badge<input name="badge" placeholder="New drop"></label></div><label>Product image URL<input name="image" type="url" placeholder="https://..."></label><label>Description<textarea name="description" rows="2"></textarea></label><button class="button button-dark" type="submit">Add product +</button></form></div><div class="admin-panel" style="margin-top:25px;background:white;border:1px solid var(--line);padding:24px"><h2 style="font:28px var(--serif)">Current products <span id="adminProductCount"></span></h2><div id="adminProductList"></div></div><div class="admin-panel" style="margin-top:25px;background:white;border:1px solid var(--line);padding:24px"><h2 style="font:28px var(--serif)">Demo orders & custom requests</h2><p class="muted">Orders are stored in this browser until a backend is connected.</p><div id="adminOrders"></div></div></main>`;
  const list=()=>{$("#adminProductCount").textContent=`(${products.length})`;$("#adminProductList").innerHTML=products.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--line);padding:14px 0"><div><strong>${escapeHTML(p.name)}</strong><div class="muted">${escapeHTML(p.category)} · ${naira(p.price)}</div></div><button class="filter-pill" data-delete-product="${escapeHTML(p.id)}">Delete</button></div>`).join("");const orders=loadJSON("ab_orders",[]);$("#adminOrders").innerHTML=orders.length?orders.map(o=>`<div style="border-top:1px solid var(--line);padding:14px 0"><strong>${escapeHTML(o.type)} · ${escapeHTML(o.name||"Customer")}</strong><p class="muted">${escapeHTML(o.email||"")} · ${escapeHTML(o.status||"Pending")} · ${naira(o.total||0)}</p><small>${escapeHTML(o.summary||o.description||"")}</small></div>`).join(""):"<p class='muted'>No demo orders yet.</p>"};
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
$("#accountButton").addEventListener("click",()=>openModal("accountModal"));
$("#customOrderButton").addEventListener("click",()=>openModal("customModal"));
$("#checkoutButton").addEventListener("click",()=>{if(!cart.length){notify("Your bag is empty.");return}$("#checkoutTotal").textContent=naira(cart.reduce((n,x)=>n+x.price*x.qty,0));openModal("checkoutModal")});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$(".main-nav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAll()});
$("#accountForm").addEventListener("submit",async e=>{
  e.preventDefault();const email=$("#accountEmail").value.trim(),password=$("#accountPassword").value;
  if(supabase){const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error){const signup=await supabase.auth.signUp({email,password});$("#accountMessage").textContent=signup.error?signup.error.message:"Account created. Check your email if confirmation is enabled.";return}$("#accountMessage").textContent=`Signed in as ${data.user.email}`;notify("Signed in successfully.");}
  else{$("#accountMessage").textContent=`Demo account ready for ${email}. Configure Supabase to enable secure accounts.`;saveJSON("ab_demo_user",{email});}
});
$("#customForm").addEventListener("submit",async e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const request={type:"Custom request",name:d.name,email:d.email,total:0,status:"Quote needed",description:`${d.garment}; size ${d.size}; ${d.destination}; ${d.description}`,summary:`${d.garment} · ${d.size} · ${d.destination}`,details:d,created_at:new Date().toISOString()};
  if(supabase){const {error}=await supabase.from("custom_orders").insert([{customer_name:d.name,email:d.email,garment:d.garment,size:d.size,measurements:d.measurements,description:d.description,reference_url:d.reference_url,destination:d.destination,status:"quote_needed"}]);if(error){notify("Could not submit. Check database setup.");return}}
  const orders=loadJSON("ab_orders",[]);orders.unshift(request);saveJSON("ab_orders",orders);$("#customMessage").textContent="Request saved. The brand will need to confirm a quote before payment.";e.target.reset();notify("Custom request submitted ✿");setTimeout(closeAll,900);
});
$("#checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const total=cart.reduce((n,x)=>n+x.price*x.qty,0);const order={type:"Ready-to-wear",name:d.name,email:d.email,total,status:"Awaiting payment",summary:cart.map(x=>`${x.name} (${x.size}) × ${x.qty}`).join(", "),details:d,items:cart,created_at:new Date().toISOString()};
  if(supabase){const {data,error}=await supabase.from("orders").insert([{customer_name:d.name,email:d.email,phone:d.phone,shipping_address:d.address,country:d.country,notes:d.notes,items:cart,total_amount:total,currency:"NGN",status:"pending_payment"}]).select().single();if(error){$("#checkoutMessage").textContent="Order could not be created. Check Supabase tables and policies.";return}
    if(CONFIG.paystackPublicKey){const handler=PaystackPop.setup({key:CONFIG.paystackPublicKey,email:d.email,amount:total*100,currency:"NGN",ref:"AB_"+Date.now(),metadata:{order_id:data.id,customer_name:d.name},callback:function(response){notify("Payment submitted for verification. Reference: "+response.reference);cart=[];saveJSON("ab_cart",cart);renderCart();closeAll()},onClose:function(){notify("Payment window closed. Your order remains pending.")}});handler.openIframe();$("#checkoutMessage").textContent="Order created. Complete payment in the secure Paystack window.";return}
  }
  const orders=loadJSON("ab_orders",[]);orders.unshift(order);saveJSON("ab_orders",orders);$("#checkoutMessage").textContent="Demo order created. No money has been charged. Connect Supabase and Paystack to enable checkout.";notify("Demo order created. No payment taken.");cart=[];saveJSON("ab_cart",cart);renderCart();setTimeout(closeAll,1400);
});
$("#newsletterForm").addEventListener("submit",e=>{e.preventDefault();const email=$("#newsletterEmail").value.trim();const list=loadJSON("ab_newsletter",[]);if(!list.includes(email))list.push(email);saveJSON("ab_newsletter",list);$("#newsletterMessage").textContent="You're on the list. Expect lovely things ✿";e.target.reset()});
$("#year").textContent=new Date().getFullYear();
initSupabase();
if(adminMode())renderAdmin();else{renderProducts();renderCart()}
