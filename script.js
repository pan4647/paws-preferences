
    // Configuration
    const CAT_COUNT = 10; // change to 10-20 as you like
    const cardsEl = document.getElementById('cards');
    const summaryEl = document.getElementById('summary');
    const likedGrid = document.getElementById('liked-grid');
    const summaryTitle = document.getElementById('summary-title');
    const summarySub = document.getElementById('summary-sub');
    const restartBtn = document.getElementById('restart');

    // State
    let cats = [];
    let index = 0; // current top index (0 is topmost)
    let liked = [];
    let history = []; // stack of {idx, liked, url}

    // Utilities
    function cataasUrl(seed) {
  return `https://cataas.com/cat?cache=${seed}`;
}


    // Build list of image URLs
    function buildCats(n){
      const arr = [];
      for(let i=0;i<n;i++){
        // include some variety (text, filter) to reduce repeats
        const seed = `r=${Date.now()%100000}-${i}`;
        const url = cataasUrl(seed);
        arr.push({url, id:i});
      }
      return arr;
    }

    // Create DOM card
    function createCard(catObj, depth){
      const el = document.createElement('div');
      el.className = 'card';
      el.style.zIndex = 100 - depth;
      el.dataset.idx = catObj.id;

      const badgeLike = document.createElement('div'); badgeLike.className='badge like'; badgeLike.textContent='LIKE'; el.appendChild(badgeLike);
      const badgeNope = document.createElement('div'); badgeNope.className='badge nope'; badgeNope.textContent='NOPE'; el.appendChild(badgeNope);

      const img = document.createElement('img');
      img.src = catObj.url;
      img.alt = 'Cute cat';
      el.appendChild(img);

      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `Cat ${catObj.id + 1} of ${cats.length}`;
      el.appendChild(meta);

      // interactions
      setupDrag(el, catObj);

      return el;
    }

    // Render initial stack
    function renderStack(){
      cardsEl.innerHTML = '';
      for(let i=cats.length-1;i>=0;i--){
        const card = createCard(cats[i], cats.length - i);
        // slight scale for depth
        const scale = 1 - (cats.length - i - 1) * 0.02;
        card.style.transform = `translate(-50%,-50%) scale(${scale})`;
        cardsEl.appendChild(card);
      }
      index = cats.length - 1; // top card is last appended
    }

    function setupDrag(cardEl, catObj){
      let startX=0,startY=0,dx=0,dy=0,isDown=false;
      const likeBadge = cardEl.querySelector('.badge.like');
      const nopeBadge = cardEl.querySelector('.badge.nope');

      function setTransform(x,y,rot,scale=1){
        cardEl.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot}deg) scale(${scale})`;
      }

      function pointerDown(e){
        isDown = true; cardEl.style.transition = 'none';
        startX = e.clientX ?? e.touches?.[0]?.clientX; startY = e.clientY ?? e.touches?.[0]?.clientY;
        cardEl.style.boxShadow = '0 30px 60px rgba(0,0,0,0.65)';
      }
      function pointerMove(e){
        if(!isDown) return;
        const cx = e.clientX ?? e.touches?.[0]?.clientX; const cy = e.clientY ?? e.touches?.[0]?.clientY;
        dx = cx - startX; dy = cy - startY;
        const rot = dx / 15;
        const scale = 1.02;
        setTransform(dx,dy,rot,scale);
        // badges
        const t = Math.min(Math.abs(dx) / 100, 1);
        if(dx>0){ likeBadge.style.opacity = t; likeBadge.style.transform='scale(1)'; nopeBadge.style.opacity=0; }
        else{ nopeBadge.style.opacity = t; nopeBadge.style.transform='scale(1)'; likeBadge.style.opacity=0; }
      }
      function pointerUp(e){
        if(!isDown) return; isDown=false; cardEl.style.boxShadow='';
        cardEl.style.transition = 'transform 300ms ease, opacity 200ms ease';
        const threshold = cardEl.clientWidth * 0.28;
        if(Math.abs(dx) > threshold){
          // decide
          const likedNow = dx > 0;
          const toX = (dx > 0 ? window.innerWidth : -window.innerWidth) * 1.2;
          const rot = dx/8;
          cardEl.style.transform = `translate(calc(-50% + ${toX}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`;
          // record
          onCardSwiped(catObj, likedNow, cardEl);
          // fade out and remove later
          setTimeout(()=>{ cardEl.remove(); checkEnd(); }, 350);
        } else {
          // reset
          cardEl.style.transform = '';
          likeBadge.style.opacity=0; nopeBadge.style.opacity=0;
        }
        dx=0;dy=0;
      }

      // mouse
      cardEl.addEventListener('mousedown', pointerDown);
      window.addEventListener('mousemove', pointerMove);
      window.addEventListener('mouseup', pointerUp);
      // touch
      cardEl.addEventListener('touchstart', pointerDown, {passive:true});
      window.addEventListener('touchmove', pointerMove, {passive:true});
      window.addEventListener('touchend', pointerUp);

      // buttons (fallback)
    }

    function onCardSwiped(catObj, likedNow, el){
      history.push({idx:catObj.id, liked:likedNow, url:catObj.url});
      if(likedNow) liked.push(catObj);
      index--;
    }

    function checkEnd(){
      const cards = document.querySelectorAll('.card');
    
      // If no cards left → summary
      if(cards.length === 0){
        showSummary();
        return;
      }
    
      // ⭐ NEW FIX: reset next top card to full size
      const newTop = cards[0];
      newTop.style.transition = "transform 200ms ease";
      newTop.style.transform = "translate(-50%,-50%) scale(1)";
    }


    // programmatic actions from buttons
    function swipeTop(likedNow){
      const top = document.querySelector('.card:first-child'); // FIXED
      if(!top) return;
    
      const dy = 0;
      const toX = (likedNow ? window.innerWidth : -window.innerWidth) * 1.2;
      const rot = likedNow ? 15 : -15;
    
      top.style.transition = 'transform 350ms ease';
      top.style.transform = `translate(calc(-50% + ${toX}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`;
    
      const idx = parseInt(top.dataset.idx,10);
      const catObj = cats.find(c=>c.id===idx);
    
      onCardSwiped(catObj, likedNow, top);
    
      setTimeout(()=>{ top.remove(); checkEnd(); }, 360);
    }

    // summary
    function showSummary(){
      summaryEl.style.display = 'flex';
      summaryTitle.textContent = `You liked ${liked.length} cat${liked.length===1?'':'s'}`;
      summarySub.textContent = liked.length ? 'Here are the ones you liked:' : 'You didn\'t like any — give it another try!';
      likedGrid.innerHTML = '';
      liked.forEach(c=>{
        const im = document.createElement('img'); im.src = c.url; im.alt='liked cat'; likedGrid.appendChild(im);
      });
    }

    // restart
    restartBtn.addEventListener('click', ()=>{
      summaryEl.style.display='none'; liked=[]; history=[]; init();
    });

    // control buttons
    document.getElementById('likeBtn').addEventListener('click', ()=>swipeTop(true));
    document.getElementById('dislikeBtn').addEventListener('click', ()=>swipeTop(false));

    // Initialization
    function init(){
      cats = buildCats(CAT_COUNT);
      liked = []; history = [];
      renderStack();
      summaryEl.style.display='none';
    }

    // start
    init();

    // accessibility: keyboard shortcuts
    window.addEventListener('keydown', e=>{
      if(e.key==='ArrowRight') swipeTop(true);
      if(e.key==='ArrowLeft') swipeTop(false);
    });
