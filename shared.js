/* Theme toggle */
function toggleTheme(){
  var h=document.documentElement,b=document.getElementById('themeBtn');
  if(h.getAttribute('data-theme')==='light'){h.removeAttribute('data-theme');b.textContent='\u2600'}
  else{h.setAttribute('data-theme','light');b.textContent='\uD83C\uDF19'}
}

/* Waitlist modal */
function openWaitlist(){
  document.getElementById('wlOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeWaitlist(){
  document.getElementById('wlOverlay').classList.remove('active');
  document.body.style.overflow='';
  /* Reset after close */
  setTimeout(function(){
    document.getElementById('wlFormView').style.display='';
    document.getElementById('wlSuccess').classList.remove('show');
    document.getElementById('wlForm').reset();
    var b=document.getElementById('wlSubmitBtn');
    b.innerHTML='Join the Waitlist &#x2192;';b.disabled=false;
  },300);
}
function submitWaitlistModal(e){
  e.preventDefault();
  var email=document.getElementById('wlEmail').value;
  var name=document.getElementById('wlName').value;
  var interest=document.querySelector('.wl-form select').value;
  var btn=document.getElementById('wlSubmitBtn');
  btn.textContent='Joining...';btn.disabled=true;

  /* POST to Formspree */
  var formId=window.FORMSPREE_ID||'xdaljqgz';
  fetch('https://formspree.io/f/'+formId,{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({email:email,name:name||'(not provided)',interest:interest,source:'clawcorp-waitlist',timestamp:new Date().toISOString(),_subject:'New ClawCorp Waitlist Signup',_replyto:email})
  }).then(function(r){ return r.json(); }).then(function(data){
    if(data.ok || data.next) { sendConfirmationEmail(email,name,interest); }
    else { btn.textContent='Error - try again'; btn.disabled=false; console.error('Form error:',data); }
  }).catch(function(err){
    btn.textContent='Error - try again'; btn.disabled=false;
    console.error('Waitlist error:',err);
  });

  function showSuccess(){
    document.getElementById('wlFormView').style.display='none';
    document.getElementById('wlSuccess').classList.add('show');
  }

  function sendConfirmationEmail(userEmail,userName,userInterest){
    if(!window.CLAWCORP_CONFIG||!window.CLAWCORP_CONFIG.emailjs){
      showSuccess();return;
    }
    emailjs.send(window.CLAWCORP_CONFIG.emailjs.serviceId,window.CLAWCORP_CONFIG.emailjs.templateId,{
      to_email:userEmail,
      reply_to:userEmail,
      user_name:userName||'Claw Friend',
      user_plan:userInterest
    }).then(function(response){
      showSuccess();
    }).catch(function(error){
      console.error('Email send failed:',error);
      showSuccess();
    });
  }
}

/* Show waitlist popup for all CTA buttons */
function showComingSoon(el){openWaitlist();}

/* Bottom CTA form - submit directly to Formspree */
function submitWaitlist(e){
  e.preventDefault();
  var email=document.getElementById('waitlistEmail').value;
  if(!email||email.indexOf('@')<1)return;
  var btn=document.getElementById('waitlistBtn');
  btn.textContent='Joining...';btn.disabled=true;
  var formId=window.FORMSPREE_ID||'xdaljqgz';
  fetch('https://formspree.io/f/'+formId,{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({email:email,source:'clawcorp-bottom-cta',timestamp:new Date().toISOString()})
  }).then(function(r){ return r.json(); }).then(function(data){
    if(data.ok || data.next) {
      sendConfirmationEmail(email);
    }
    else { btn.innerHTML='Error - try again &#x2192;'; btn.disabled=false; console.error('Form error:',data); }
  }).catch(function(err){
    btn.innerHTML='Error - try again &#x2192;'; btn.disabled=false;
    console.error('Waitlist error:',err);
  });

  function sendConfirmationEmail(userEmail){
    if(!window.CLAWCORP_CONFIG||!window.CLAWCORP_CONFIG.emailjs){
      btn.innerHTML='You are on the list! &#x2713;'; btn.style.background='#22c55e';return;
    }
    emailjs.send(window.CLAWCORP_CONFIG.emailjs.serviceId,window.CLAWCORP_CONFIG.emailjs.templateId,{
      to_email:userEmail,
      reply_to:userEmail,
      user_name:'Claw Friend',
      user_plan:'pro'
    }).then(function(response){
      btn.innerHTML='You are on the list! &#x2713;'; btn.style.background='#22c55e';
    }).catch(function(error){
      console.error('Email send failed:',error);
      btn.innerHTML='You are on the list! &#x2713;'; btn.style.background='#22c55e';
    });
  }
}

/* Kanban auto-scroll */
(function(){
  var kb=document.querySelector('.kb');
  if(!kb)return;
  var speed=30; /* px per second */
  var paused=false;
  var idleTimer=null;
  var endTimer=null;
  var raf=null;
  var lastTime=null;
  var visible=false;

  function step(ts){
    if(!visible){raf=requestAnimationFrame(step);return;}
    if(!lastTime)lastTime=ts;
    var dt=(ts-lastTime)/1000;
    lastTime=ts;
    if(!paused){
      var maxScroll=kb.scrollWidth-kb.clientWidth;
      if(kb.scrollLeft>=maxScroll-1){
        /* reached the end: pause 3s then scroll back */
        if(!endTimer){
          paused=true;
          endTimer=setTimeout(function(){
            kb.scrollTo({left:0,behavior:'smooth'});
            paused=false;
            endTimer=null;
          },3000);
        }
      }else{
        kb.scrollLeft+=speed*dt;
      }
    }
    raf=requestAnimationFrame(step);
  }

  function pauseScroll(){
    paused=true;
    clearTimeout(idleTimer);
  }

  function resumeAfterIdle(){
    clearTimeout(idleTimer);
    idleTimer=setTimeout(function(){paused=false;},2000);
  }

  kb.addEventListener('mouseenter',pauseScroll);
  kb.addEventListener('touchstart',pauseScroll,{passive:true});
  kb.addEventListener('mouseleave',resumeAfterIdle);
  kb.addEventListener('touchend',resumeAfterIdle);

  /* IntersectionObserver: only scroll when section visible */
  var section=kb.closest('.sec')||kb.parentElement;
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      visible=e.isIntersecting;
      if(visible){lastTime=null;}
    });
  },{threshold:0.15});
  obs.observe(section);

  raf=requestAnimationFrame(step);
})();

// Opportunist notification popup - trigger on scroll past Agent Roster
(function(){
  var shown=false;
  var target=document.getElementById('pipeline')||document.querySelector('.sec');
  if(!target)return;
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting&&!shown){
        shown=true;
        obs.disconnect();
        var n=document.getElementById('oppNotif');
        if(n)n.classList.add('show');
        setTimeout(function(){if(n)n.classList.remove('show');},12000);
      }
    });
  },{threshold:0.3});
  obs.observe(target);
})();

// Agent Chat Popups - scroll-triggered banter
(function(){
  var popupEl=null;
  var lastPopupTime=0;
  var shownSet={};
  var MIN_GAP=8000;
  var DISPLAY_TIME=5000;
  var dismissTimer=null;

  var popups=[
    {section:"conveyor",agent:"Pixel",color:"#06b6d4",img:"./avatars/REAL-NAME-IMG/pixel.png",msg:"I aligned every pixel on that conveyor. Forge broke it in 5 minutes."},
    {section:"agents",agent:"Watchdog",color:"#ff6b6b",img:"./avatars/REAL-NAME-IMG/watchdog.png",msg:"I tested all 20 agents. 3 lied about their stats."},
    {section:"pipeline",agent:"Manager",color:"#ffd700",img:"./avatars/REAL-NAME-IMG/manager-avatar.png",msg:"Don\u2019t forget your iCheckup, Watchdog. Last sprint you skipped it."},
    {section:"liveSession",agent:"Echo",color:"#a78bfa",img:"./avatars/REAL-NAME-IMG/echo.png",msg:"I trained Forge to say \u2018on it\u2019 faster. You\u2019re welcome."},
    {section:"workflow",agent:"Backbone",color:"#22c55e",img:"./avatars/REAL-NAME-IMG/backbone.png",msg:"AUTONOMOUS mode? Bold. I like it."},
    {section:"commshub",agent:"Tour",color:"#3b82f6",img:"./avatars/REAL-NAME-IMG/tour-avatar.png",msg:"I see 47 unread messages. 46 are from Manager."},
    {section:"communication",agent:"Forge",color:"#b388ff",img:"./avatars/REAL-NAME-IMG/forge.png",msg:"You just dumped 8 tasks. I\u2019m already done with 3."},
    {section:"superpowers",agent:"Avocat",color:"#ec4899",img:"./avatars/REAL-NAME-IMG/avocat-avatar.png",msg:"I found a GPL dependency in your code. We need to talk."},
    {section:"features",agent:"Sentinel",color:"#f97316",img:"./avatars/REAL-NAME-IMG/sentinel-avatar.png",msg:"All 20 agents. Zero breaches. You\u2019re safe."},
    {section:"pricing",agent:"Boss",color:"#eab308",img:"./avatars/REAL-NAME-IMG/boss.svg",msg:"Every dollar you save is a dollar I reinvest. Automatically."},
    {section:"cta",agent:"Marketer",color:"#f43f5e",img:"./avatars/REAL-NAME-IMG/marketer.svg",msg:"That signup button? I A/B tested 14 shades of purple."}
  ];

  function createPopup(){
    var el=document.createElement('div');
    el.className='agent-popup';
    el.innerHTML='<div class="agent-popup-av"></div><div class="agent-popup-content"><div class="agent-popup-name"></div><div class="agent-popup-msg"></div></div>';
    document.body.appendChild(el);
    return el;
  }

  function showPopup(data){
    var now=Date.now();
    if(now-lastPopupTime<MIN_GAP)return;
    if(shownSet[data.section])return;
    shownSet[data.section]=true;
    lastPopupTime=now;

    if(!popupEl) popupEl=createPopup();
    if(dismissTimer){clearTimeout(dismissTimer);popupEl.classList.remove('show');}

    var av=popupEl.querySelector('.agent-popup-av');
    av.style.background=data.color;
    if(data.img){av.innerHTML='<img src="'+data.img+'" alt="'+data.agent+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';} else {av.textContent=data.agent.charAt(0);}

    var nm=popupEl.querySelector('.agent-popup-name');
    nm.innerHTML=data.agent+' <span style="background:'+data.color+'"></span>';

    popupEl.querySelector('.agent-popup-msg').textContent=data.msg;

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        popupEl.classList.add('show');
      });
    });

    dismissTimer=setTimeout(function(){
      popupEl.classList.remove('show');
      dismissTimer=null;
    },DISPLAY_TIME);
  }

  var sectionEls=[];
  popups.forEach(function(p){
    var el=document.getElementById(p.section);
    if(el) sectionEls.push({el:el,data:p});
  });

  if(!sectionEls.length)return;

  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      sectionEls.forEach(function(s){
        if(s.el===e.target) showPopup(s.data);
      });
    });
  },{threshold:0.25});

  sectionEls.forEach(function(s){observer.observe(s.el);});
})();

// Agent speech bubbles (cloud style)
(function(){
  var b=document.createElement('div');
  b.className='ag-bubble';
  document.body.appendChild(b);
  var ht=null;
  function hide(){clearTimeout(ht);b.classList.remove('show');}
  document.querySelectorAll('.ag-card[data-bubble]').forEach(function(c){
    c.addEventListener('click',function(e){
      e.stopPropagation();
      hide();
      b.textContent='\u201C'+c.getAttribute('data-bubble')+'\u201D';
      requestAnimationFrame(function(){
        var r=c.getBoundingClientRect();
        var tw=b.offsetWidth,th=b.offsetHeight;
        var x=r.left+r.width/2-tw/2;
        var y=r.top-th-14;
        if(y<8){y=r.bottom+14;}
        b.style.left=Math.max(8,Math.min(x,window.innerWidth-tw-8))+'px';
        b.style.top=y+'px';
        b.classList.add('show');
      });
      ht=setTimeout(hide,3000);
    });
  });
  document.addEventListener('click',hide);
  window.addEventListener('scroll',hide,{passive:true});
})();
