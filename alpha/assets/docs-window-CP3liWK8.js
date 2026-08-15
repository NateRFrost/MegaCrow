import{a as v}from"./tauriRuntime-DtPG0GLQ.js";import{g as x}from"./window-uj017Hl8.js";const y="MegaCrow Docs",L=document.querySelector("#docs-back"),M=document.querySelector("#docs-forward"),S=document.querySelector(".docs-chrome-title"),b=document.querySelector("#docs-frame"),D=document.querySelector(".docs-chrome"),h=document.querySelector("#docs-window-controls");let r=0,m=1,d=!1,a=null;const g=`
  <svg aria-hidden="true" viewBox="0 0 12 12">
    <rect fill="none" height="8" stroke="currentColor" stroke-width="1" width="8" x="2" y="2" />
  </svg>
`,C=`
  <svg aria-hidden="true" viewBox="0 0 12 12">
    <rect fill="none" height="6" stroke="currentColor" stroke-width="1" width="6" x="3.5" y="1.5" />
    <rect fill="#252526" height="6" stroke="currentColor" stroke-width="1" width="6" x="1.5" y="3.5" />
  </svg>
`,l=()=>{L.disabled=r<=0,M.disabled=r>=m-1},k=()=>b.contentWindow,p=t=>{const e=t.trim()||y;S.textContent=e,document.title=e,v()&&x().setTitle(e)},n=()=>{var t,e;try{const o=(e=(t=b.contentDocument)==null?void 0:t.title)==null?void 0:e.trim();p(o||y)}catch{p(y)}},T=t=>{a==null||a.disconnect(),a=null,n();const o=t.document.querySelector("title");o&&(a=new MutationObserver(()=>{n()}),a.observe(o,{childList:!0,characterData:!0,subtree:!0}))},u=()=>{const t=k();!t||r<=0||(d=!0,r-=1,l(),t.history.back(),queueMicrotask(()=>{d=!1,n()}))},w=()=>{const t=k();!t||r>=m-1||(d=!0,r+=1,l(),t.history.forward(),queueMicrotask(()=>{d=!1,n()}))},q=()=>{d||(r+=1,m=r+1,l(),n())},R=()=>{n()},I=t=>{const{history:e}=t,o=e.pushState.bind(e),i=e.replaceState.bind(e);e.pushState=((s,c,f)=>{o(s,c,f),q()}),e.replaceState=((s,c,f)=>{i(s,c,f),R()}),t.addEventListener("popstate",()=>{d||l(),n()})},W=()=>{if(!v())return;const t=x();h.innerHTML=`
    <div aria-label="Window controls" class="window-controls" role="group">
      <button aria-label="Minimize" class="window-control" type="button" data-action="minimize">
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <rect fill="currentColor" height="1" width="8" x="2" y="6" />
        </svg>
      </button>
      <button aria-label="Maximize" class="window-control" type="button" data-action="maximize">
        ${g}
      </button>
      <button aria-label="Close" class="window-control window-control-close" type="button" data-action="close">
        <svg aria-hidden="true" viewBox="0 0 12 12">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-linecap="round" stroke-width="1.1" />
        </svg>
      </button>
    </div>
  `;const e=h.querySelector('[data-action="maximize"]'),o=async()=>{const i=await t.isMaximized();e.innerHTML=i?C:g,e.setAttribute("aria-label",i?"Restore":"Maximize")};o(),t.onResized(()=>{o()}),h.addEventListener("click",i=>{var c;const s=(c=i.target)==null?void 0:c.closest("[data-action]");if(s)switch(s.dataset.action){case"minimize":t.minimize();break;case"maximize":t.toggleMaximize();break;case"close":t.close();break}}),D.addEventListener("dblclick",i=>{i.target.closest("button")||t.toggleMaximize()})};L.addEventListener("click",u);M.addEventListener("click",w);const E=t=>{if(!t.defaultPrevented){if(t.key==="BrowserBack"||t.code==="BrowserBack"){t.preventDefault(),u();return}if(t.key==="BrowserForward"||t.code==="BrowserForward"){t.preventDefault(),w();return}if(t.altKey&&(t.key==="ArrowLeft"||t.key==="Left")){t.preventDefault(),u();return}t.altKey&&(t.key==="ArrowRight"||t.key==="Right")&&(t.preventDefault(),w())}},z=t=>{t.button===3?(t.preventDefault(),u()):t.button===4&&(t.preventDefault(),w())},B=t=>{(t.button===3||t.button===4)&&t.preventDefault()};window.addEventListener("keydown",E);window.addEventListener("mouseup",z);window.addEventListener("mousedown",B);b.addEventListener("load",()=>{const t=k();if(t){r=0,m=1,l(),I(t),T(t);try{t.addEventListener("keydown",E),t.addEventListener("mouseup",z),t.addEventListener("mousedown",B)}catch{}}});W();l();
