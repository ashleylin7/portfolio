// Shared behaviour for every page
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = !matchMedia('(hover: hover)').matches;

// Scroll-in: adds .in once an element first comes on screen.
// The stagger delay comes from an inline --d (see .reveal.in in styles.css).
const revealOnScroll = (selector, options) => {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), options);
  document.querySelectorAll(selector).forEach(el => io.observe(el));
};
revealOnScroll('.reveal', { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
revealOnScroll('.pol', { threshold: 0.35 }); // polaroids drop in as you reach them

// Service highlights replay each time they scroll into view and reset when they leave
const hl = new IntersectionObserver(entries => entries.forEach(e => {
  e.target.classList.toggle('in', e.isIntersecting);
}), { threshold: 0.5 });
document.querySelectorAll('.helps-item').forEach(el => hl.observe(el));

// Experience and education: each entry slides open and shut, so the rules below it move smoothly
const EASE = 'cubic-bezier(.2,.7,.1,1)';
const entries = [...document.querySelectorAll('#experience details.entry')];
const isOpen = d => d._open ?? d.open;
const setOpen = (d, open) => {
  d._open = open;
  d.classList.toggle('is-open', open);
  if (reduce) { d.open = open; return; }
  const from = d.offsetHeight;
  d._anim?.cancel();
  if (open) d.open = true;
  const to = open ? d.offsetHeight : d.querySelector('summary').offsetHeight;
  d.style.overflow = 'hidden';
  d.querySelector('.blurb').animate(
    open ? [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }]
         : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }],
    { duration: 600, easing: EASE });
  d._anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 600, easing: EASE });
  d._anim.onfinish = () => { d.open = open; d.style.overflow = ''; d._anim = null; };
};
const expandBtn = document.querySelector('.expand-all');
const sync = () => {
  if (!expandBtn) return;
  const allOpen = entries.every(isOpen);
  expandBtn.setAttribute('aria-expanded', String(allOpen));
  expandBtn.textContent = allOpen ? 'Collapse all' : 'Expand all';
};
entries.forEach(d => d.querySelector('summary').addEventListener('click', e => {
  e.preventDefault();
  setOpen(d, !isOpen(d));
  sync();
}));
if (expandBtn) {
  expandBtn.addEventListener('click', () => {
    const open = !entries.every(isOpen);
    entries.forEach(d => { if (isOpen(d) !== open) setOpen(d, open); });
    sync();
  });
}

// Currently-into orbit: emojis travel once around the oval every 36 seconds,
// pausing while one is hovered or focused
const orbs = [...document.querySelectorAll('.orb')];
orbs.forEach((o, i) => o.style.setProperty('--i', i));
if (orbs.length) {
  const start = orbs.map(o => parseFloat(o.style.getPropertyValue('--a0')) || 0);
  // Near the top of the oval the emoji shrinks a little; near the bottom it grows
  const place = turn => orbs.forEach((o, i) => {
    const deg = start[i] + turn;
    o.style.setProperty('--a', deg.toFixed(2) + 'deg');
    o.style.setProperty('--k', (1 + 0.22 * Math.sin(deg * Math.PI / 180)).toFixed(3));
  });
  if (reduce) {
    place(0);
  } else {
    let paused = false, elapsed = 0, last = performance.now();
    const hold = on => () => { paused = on; };
    orbs.forEach(o => {
      o.addEventListener('pointerenter', hold(true));
      o.addEventListener('pointerleave', hold(false));
      o.addEventListener('focus', hold(true));
      o.addEventListener('blur', hold(false));
    });
    (function travel(now) {
      if (!paused) elapsed += now - last;
      last = now;
      place((elapsed / 36000) * 360);
      requestAnimationFrame(travel);
    })(last);
  }
}

// Scroll progress bar
const bar = document.querySelector('.progress');
addEventListener('scroll', () => {
  bar.style.transform = `scaleX(${scrollY / (document.documentElement.scrollHeight - innerHeight)})`;
}, { passive: true });

// Hero portrait fades in (with reduced motion, CSS shows it straight away)
const frame = document.querySelector('.portrait .frame');
if (frame && !reduce) frame.animate(
  [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }],
  { duration: 1200, delay: 300, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'forwards' });

// Background: faint drifting petals and a soft blur along the bottom edge
if (!reduce) {
  const petals = document.createElement('div');
  petals.className = 'bg-petals';
  for (let i = 0; i < 9; i++) {
    const p = document.createElement('i');
    p.style.left = (2 + Math.random() * 96) + '%';
    p.style.setProperty('--dur', (18 + Math.random() * 14) + 's');
    p.style.setProperty('--delay', (-Math.random() * 30) + 's');
    p.style.setProperty('--s', (0.7 + Math.random() * 0.8).toFixed(2));
    petals.appendChild(p);
  }
  const edge = document.createElement('div');
  edge.className = 'edge-blur';
  [petals, edge].forEach(el => el.setAttribute('aria-hidden', 'true'));
  document.body.append(petals, edge);
}

// The bottom blur steps aside whenever the footer is on screen
const edgeBlur = document.querySelector('.edge-blur');
const footerEl = document.querySelector('footer');
if (edgeBlur && footerEl) {
  const checkFooter = () => edgeBlur.classList.toggle('off', footerEl.getBoundingClientRect().top < innerHeight);
  addEventListener('scroll', checkFooter, { passive: true });
  addEventListener('resize', checkFooter);
  checkFooter();
}

// Click feedback: a white sparkle where you press, and a light ray sweeping across buttons and cards
if (!reduce) {
  const sparkleAt = (x, y) => {
    const s = document.createElement('div');
    s.className = 'click-spark';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    document.body.appendChild(s);
    s.animate([
      { transform: 'scale(0) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.25) rotate(45deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(0) rotate(90deg)', opacity: 0 }
    ], { duration: 650, easing: 'ease-out' }).onfinish = () => s.remove();
  };
  const sweep = el => {
    const ray = document.createElement('span');
    ray.className = 'ray';
    el.appendChild(ray);
    el.style.overflow = 'hidden';
    ray.animate([
      { transform: 'translateX(-120%) skewX(-20deg)' },
      { transform: 'translateX(280%) skewX(-20deg)' }
    ], { duration: 800, easing: 'ease-in-out' }).onfinish = () => { ray.remove(); el.style.overflow = ''; };
  };
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.btn, .pill, .svc');
    if (!el) return;
    sparkleAt(e.clientX, e.clientY);
    sweep(el);
  });
}

// Flip cards: hover on desktop; tap, Enter or Space on touch and keyboard
document.querySelectorAll('.flip').forEach(card => {
  const toggle = () => card.classList.toggle('flipped');
  card.addEventListener('click', () => { if (touch) toggle(); });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// Toolkit cards: hover flips them on desktop; tap, Enter or Space flip them on touch and keyboard
document.querySelectorAll('.skill-card').forEach(card => {
  const toggle = () => card.classList.toggle('flipped');
  card.addEventListener('click', () => { if (touch) toggle(); });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// Gallery: filter by category (gallery page only)
const gal = document.getElementById('gallery');
if (gal) {
  const btns = [...document.querySelectorAll('[data-filter]')];
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const cat = btn.dataset.filter;
    [...gal.children].forEach(card => {
      card.hidden = cat !== 'all' && card.dataset.cat !== cat;
    });
  }));
}

// Star cursor with leaf and sparkle trails (fine pointers only)
if (matchMedia('(pointer: fine)').matches && !reduce) {
  document.documentElement.classList.add('fine-pointer');

  const make = (cls, n) => Array.from({ length: n }, () => {
    const el = document.createElement('div');
    el.className = cls;
    document.body.appendChild(el);
    return el;
  });
  const star = make('c-star', 1)[0];
  const leaves = make('c-leaf', 14);
  const sparks = make('c-spark', 14);
  let li = 0, si = 0, lastL = 0, lastS = 0;

  addEventListener('pointermove', e => {
    const { clientX: x, clientY: y } = e;
    const now = performance.now();
    star.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (now - lastL > 70) {
      lastL = now;
      const rot = Math.random() * 360;
      leaves[li++ % leaves.length].animate([
        { transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(1)`, opacity: .55 },
        { transform: `translate3d(${x + (Math.random() - .5) * 30}px, ${y + 24}px, 0) rotate(${rot + 90}deg) scale(.4)`, opacity: 0 }
      ], { duration: 900, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'forwards' });
    }

    if (now - lastS > 55) {
      lastS = now;
      const dx = (Math.random() - .5) * 26, dy = (Math.random() - .5) * 26;
      sparks[si++ % sparks.length].animate([
        { transform: `translate3d(${x}px, ${y}px, 0) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate3d(${x + dx * 1.6}px, ${y + dy * 1.6 + 8}px, 0) scale(0) rotate(120deg)`, opacity: 0 }
      ], { duration: 650, easing: 'ease-out', fill: 'forwards' });
    }
  }, { passive: true });

  // The star turns solid-white over things you can flip or look at; links and buttons leave it plain
  document.addEventListener('pointerover', e => {
    const control = e.target.closest('a, button, summary, input, textarea');
    star.classList.toggle('hover', !control && !!e.target.closest('.flip, .pol, .collage figure'));
  });
}
