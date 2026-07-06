/* ==========================================================================
   AKNAVJ — site interactions
   Mobile nav · hub hover preview · gallery lightbox
   All features are guarded by element presence, so one file serves every page.
   ========================================================================== */
(function () {
    'use strict';

    /* mobile nav */
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /*  hub hover preview  */
    var hubTop = document.getElementById('hub-bg-top');
    if (hubTop) {
        var cache = {};
        document.querySelectorAll('.hub-nav a[data-bg]').forEach(function (a) {
            var src = a.getAttribute('data-bg');
            if (src && !cache[src]) { var im = new Image(); im.src = src; cache[src] = true; }
            a.addEventListener('mouseenter', function () {
                hubTop.style.backgroundImage = 'url("' + src + '")';
                hubTop.classList.add('show');
            });
            a.addEventListener('mouseleave', function () {
                hubTop.classList.remove('show');
            });
        });
    }

    /*  hub youtube video preview (IFrame API)  */
    /* The player is only revealed once it is actually PLAYING, so the buffering
       spinner and any pre-roll chrome stay hidden behind the still image. */
    var hubVideo = document.getElementById('hub-video');
    if (hubVideo && document.querySelector('.hub-nav a[data-video]')) {
        var ytPlayer = null, ytReady = false, pendingId = null, currentId = null, vHideTimer = null;

        (function loadAPI() {
            if (window.YT && window.YT.Player) { onAPIReady(); return; }
            var prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function () {
                if (typeof prev === 'function') prev();
                onAPIReady();
            };
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        })();

        function onAPIReady() {
            ytPlayer = new YT.Player('hub-video-frame', {
                host: 'https://www.youtube-nocookie.com',
                playerVars: {
                    autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0,
                    iv_load_policy: 3, modestbranding: 1, rel: 0, playsinline: 1
                },
                events: {
                    onReady: function (e) {
                        ytReady = true;
                        e.target.mute();
                        if (pendingId) loadAndPlay(pendingId);
                    },
                    onStateChange: function (e) {
                        if (e.data === YT.PlayerState.PLAYING) {
                            hubVideo.classList.add('show');
                        } else if (e.data === YT.PlayerState.ENDED) {
                            e.target.seekTo(0, true);
                            e.target.playVideo();
                        }
                    }
                }
            });
        }

        function loadAndPlay(id) {
            currentId = id;
            ytPlayer.loadVideoById(id);
            ytPlayer.mute();
        }

        function showVideo(id) {
            clearTimeout(vHideTimer);
            if (!ytReady) { pendingId = id; return; }
            if (id === currentId) {
                ytPlayer.playVideo();
                hubVideo.classList.add('show');
            } else {
                hubVideo.classList.remove('show');
                loadAndPlay(id);
            }
        }

        function hideVideo() {
            hubVideo.classList.remove('show');
            vHideTimer = setTimeout(function () {
                if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
            }, 650);
        }

        document.querySelectorAll('.hub-nav a[data-video]').forEach(function (a) {
            var id = a.getAttribute('data-video');
            if (!id) return;
            a.addEventListener('mouseenter', function () { showVideo(id); });
            a.addEventListener('mouseleave', hideVideo);
        });
    }

    /*  gallery lightbox  */
    var gallery = document.getElementById('gallery');
    var lightbox = document.getElementById('lightbox');
    if (gallery && lightbox) {
        var items = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-item'));
        var lbImg = document.getElementById('lb-img');
        var lbVideo = document.getElementById('lb-video');
        var lbYouTube = document.getElementById('lb-youtube');
        var lbCap = document.getElementById('lb-cap');
        var lbCounter = document.getElementById('lb-counter');
        var current = 0;
        var lastFocus = null;

        function stopLbVideo() {
            if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); lbVideo.hidden = true; }
        }

        function stopLbYouTube() {
            if (lbYouTube) { lbYouTube.innerHTML = ''; lbYouTube.hidden = true; }
        }

        function render(i) {
            current = (i + items.length) % items.length;
            var el = items[current];
            var full = el.getAttribute('data-full');
            var type = el.getAttribute('data-type');
            var title = el.getAttribute('data-title') || '';
            var caption = el.getAttribute('data-caption') || '';

            stopLbVideo();
            stopLbYouTube();
            lbImg.hidden = true;
            lbImg.removeAttribute('src');

            if (type === 'video' && lbVideo) {
                lbVideo.hidden = false;
                lbVideo.setAttribute('src', full);
                var pr = lbVideo.play();
                if (pr && pr.catch) pr.catch(function () {});
            } else if (type === 'youtube' && lbYouTube) {
                lbYouTube.hidden = false;
                lbYouTube.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' +
                    encodeURIComponent(full) + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" ' +
                    'title="' + title.replace(/"/g, '') + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
            } else {
                lbImg.hidden = false;
                lbImg.setAttribute('src', full);
                lbImg.setAttribute('alt', title);
            }
            lbCap.innerHTML = '<b>' + title + '</b>' + (caption ? ' — ' + caption : '');
            lbCounter.textContent = (current + 1) + ' / ' + items.length;
        }

        function open(i) {
            lastFocus = document.activeElement;
            render(i);
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            var closeBtn = document.getElementById('lb-close');
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            lightbox.classList.remove('open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            stopLbVideo();
            stopLbYouTube();
            if (lastFocus) lastFocus.focus();
        }

        items.forEach(function (el, i) {
            el.addEventListener('click', function () { open(i); });
            if (el.getAttribute('data-type') === 'video') {
                var thumb = el.querySelector('video');
                if (thumb) {
                    el.addEventListener('mouseenter', function () {
                        var p = thumb.play(); if (p && p.catch) p.catch(function () {});
                    });
                    el.addEventListener('mouseleave', function () {
                        thumb.pause(); thumb.currentTime = 0;
                    });
                }
            }
        });

        var next = document.getElementById('lb-next');
        var prev = document.getElementById('lb-prev');
        var closeEl = document.getElementById('lb-close');
        if (next) next.addEventListener('click', function () { render(current + 1); });
        if (prev) prev.addEventListener('click', function () { render(current - 1); });
        if (closeEl) closeEl.addEventListener('click', close);

        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) close();
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') render(current + 1);
            else if (e.key === 'ArrowLeft') render(current - 1);
        });
    }

    /*  wrap wide tables in article body  */
    document.querySelectorAll('.article .prose table').forEach(function (tbl) {
        if (tbl.parentNode.classList.contains('table-wrap')) return;
        var wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        tbl.parentNode.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
    });
})();
