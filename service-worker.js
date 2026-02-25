/* ==============================================================
   CIEIB — Service Worker (PWA)
   Estratégias: Cache First para assets, Network First para HTML/API
   ============================================================== */

const CACHE_NAME = 'cieib-v1';
const OFFLINE_URL = '/offline.html';

// Recursos essenciais para cache imediato (App Shell)
const APP_SHELL = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/style.css',
    '/js/main.js',
    '/js/api.js',
    '/manifest.json',
    '/fav.jpg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Recursos que serão cacheados conforme acessados
const CACHE_ON_DEMAND = [
    '/quem-somos.html',
    '/diretoria.html',
    '/noticias.html',
    '/midias.html',
    '/contato.html',
    '/area-do-ministro.html',
    '/verificar-credencial.html',
    '/lgpd.html',
    '/css/painel.css',
    '/css/admin.css',
    '/js/painel.js',
    '/js/admin.js'
];

// URLs que NUNCA devem ser cacheadas
const NEVER_CACHE = [
    '/api/',
    '/painel-ministro',
    '/painel-admin'
];

// ---- INSTALL: Cachear App Shell ----
self.addEventListener('install', (event) => {
    console.log('[SW] Install - Cacheando App Shell...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Cache individual com fallback para não travar a instalação
                return Promise.allSettled(
                    APP_SHELL.map(url =>
                        cache.add(url).catch(err => {
                            console.warn(`[SW] Falha ao cachear ${url}:`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] App Shell cacheado com sucesso');
                return self.skipWaiting();
            })
    );
});

// ---- ACTIVATE: Limpar caches antigos ----
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate - Limpando caches antigos...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log(`[SW] Removendo cache antigo: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker ativado');
                return self.clients.claim();
            })
    );
});

// ---- FETCH: Estratégias de cache ----
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições não-GET
    if (request.method !== 'GET') return;

    // Ignorar requisições cross-origin (CDN fonts, icons, etc.)
    if (url.origin !== location.origin) {
        event.respondWith(
            caches.match(request)
                .then(cached => cached || fetch(request)
                    .then(response => {
                        // Cachear fontes e CDN assets
                        if (response.ok && (
                            url.hostname.includes('fonts.googleapis.com') ||
                            url.hostname.includes('fonts.gstatic.com') ||
                            url.hostname.includes('cdnjs.cloudflare.com')
                        )) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                        }
                        return response;
                    })
                )
                .catch(() => new Response('', { status: 408 }))
        );
        return;
    }

    // Nunca cachear APIs e painéis autenticados
    if (NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
        event.respondWith(
            fetch(request).catch(() => {
                if (request.headers.get('accept')?.includes('text/html')) {
                    return caches.match(OFFLINE_URL);
                }
                return new Response(JSON.stringify({ error: 'Sem conexão' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                });
            })
        );
        return;
    }

    // ---- Estratégia para HTML: Network First ----
    if (request.headers.get('accept')?.includes('text/html') ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(cached => cached || caches.match(OFFLINE_URL));
                })
        );
        return;
    }

    // ---- Estratégia para Assets (CSS, JS, imagens): Cache First ----
    if (url.pathname.match(/\.(css|js|jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/)) {
        event.respondWith(
            caches.match(request, { ignoreSearch: true })
                .then((cached) => {
                    if (cached) {
                        // Atualizar cache em background (Stale While Revalidate)
                        fetch(request)
                            .then(response => {
                                if (response.ok) {
                                    caches.open(CACHE_NAME).then(cache => cache.put(request, response));
                                }
                            })
                            .catch(() => { /* ignorar falha de rede */ });
                        return cached;
                    }
                    return fetch(request)
                        .then(response => {
                            if (response.ok) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                            }
                            return response;
                        })
                        .catch(() => new Response('', { status: 408 }));
                })
        );
        return;
    }

    // ---- Default: Network First ----
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// ---- PUSH: Notificações Push ----
self.addEventListener('push', (event) => {
    let data = { title: 'CIEIB', body: 'Nova notificação', icon: '/icons/icon-192x192.png' };

    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch (e) {
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'cieib-notification',
        renotify: true,
        data: {
            url: data.url || '/'
        },
        actions: data.actions || [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ---- NOTIFICATION CLICK ----
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Focar janela existente ou abrir nova
                for (const client of windowClients) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(url);
            })
    );
});

// ---- BACKGROUND SYNC (futuro) ----
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('[SW] Background sync: sync-data');
        // Implementar sincronização de dados offline futuramente
    }
});

// ---- MESSAGE: Comunicação com a página ----
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        }).then(() => {
            event.ports[0]?.postMessage({ cleared: true });
        });
    }
});
