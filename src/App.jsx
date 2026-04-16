import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import {
  ShieldCheck,
  Ghost,
  Share2,
  ChevronLeft,
  Instagram,
  Loader2,
  Copy,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRight,
  XCircle,
  Globe,
  Send,
  Inbox,
  Clock,
  ExternalLink
} from 'lucide-react';

/**
 * PROJETO OFFIN - VERSÃO DE PRODUÇÃO V3
 * Foco: Resiliência In-App Browser (Instagram), Histórico de Enviados/Recebidos e Status
 */

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCxDn2wieUqdUFtFUDVJyIlWVN2Kg8WdQ0",
      authDomain: "offinn-89849.firebaseapp.com",
      projectId: "offinn-89849",
      storageBucket: "offinn-89849.firebasestorage.app",
      messagingSenderId: "580679008063",
      appId: "1:580679008063:web:9fce23acaafd6699c4dd8a"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : "offinn-89849"; 

// --- DETECÇÃO DE NAVEGADOR INTERNO (INSTAGRAM/FB) ---
const isInstagramBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (ua.indexOf('Instagram') > -1) || (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1);
};

// --- DETECÇÃO DINÂMICA DE URL ---
const getCurrentAppUrl = () => {
  const origin = window.location.origin;
  const path = window.location.pathname;
  if (path.includes('app.html') || path === '/app') {
    return origin + path;
  }
  return origin + '/app.html';
};

const APP_URL = getCurrentAppUrl();

// --- FUNÇÃO AUXILIAR DE CLIPBOARD ---
const copyToClipboardFallback = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Falha ao copiar link:', err);
  }
  document.body.removeChild(textArea);
};

// --- COMPONENTES DE UI ---
const Toast = ({ message, type = 'error', onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300 w-[90%] max-w-xs">
      <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-2 border ${
        type === 'error' ? 'bg-red-500/95 border-red-400 text-white' : 'bg-cyan-500/95 border-cyan-400 text-white'
      }`}>
        <div className="flex items-center gap-3">
          {type === 'error' ? <XCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
          <p className="text-xs font-bold leading-tight flex-1">{message}</p>
          <button onClick={onClose} className="opacity-50 hover:opacity-100"><XCircle size={16} /></button>
        </div>
      </div>
    </div>
  );
};

const BrowserWarning = () => {
  if (!isInstagramBrowser()) return null;
  return (
    <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-3 text-[10px] font-bold text-center flex items-center justify-center gap-2 animate-pulse">
      <AlertCircle size={14} />
      ESTÁS NO INSTAGRAM. SE O LOGIN FALHAR, CLICA EM "..." E "ABRIR NO NAVEGADOR".
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', icon: Icon, disabled, loading, className = '' }) => {
  const base = 'w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-cyan-500 text-white shadow-lg shadow-cyan-100/30',
    secondary: 'bg-slate-100 text-slate-500 border border-slate-200',
    ghost: 'bg-transparent text-slate-400 font-medium text-sm',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-500'
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]} ${className}`}>
      {loading ? <Loader2 className="animate-spin" size={20} /> : (
        <>
          {children}
          {Icon && <Icon size={20} />}
        </>
      )}
    </button>
  );
};

const OffinLogo = ({ scale = 1 }) => (
  <div className="relative inline-flex items-center justify-center p-6" style={{ transform: `scale(${scale})` }}>
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 translate-x-3 translate-y-2">
      <svg viewBox="0 0 240 140" className="w-[320px] h-auto opacity-90" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="gradNeon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="60" r="45" fill="none" stroke="url(#gradNeon)" strokeWidth="2.5" />
        <circle cx="95" cy="65" r="50" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
        <rect x="110" y="105" width="16" height="55" rx="8" fill="none" stroke="#06b6d4" strokeWidth="2.5" transform="rotate(-40 110 105)" />
        <text x="175" y="95" fontFamily="sans-serif" fontSize="75" fontWeight="900" fontStyle="italic" fill="none" stroke="url(#gradNeon)" strokeWidth="3.5" transform="rotate(15 175 95)">?</text>
        <circle cx="195" cy="115" r="6" fill="none" stroke="#475569" strokeWidth="3" />
      </svg>
    </div>
    <span className="text-7xl font-black tracking-tighter text-white relative z-10 italic" style={{ textShadow: '0px 2px 0px #a5f3fc, 0px 4px 0px #22d3ee, 0px 7px 0px #0891b2, 0px 10px 0px #0e7490, 3px 15px 15px rgba(0,0,0,0.25)', WebkitTextStroke: '1px #ffffff' }}>OFF</span>
    <span className="text-[4.5rem] font-black tracking-tighter relative z-10 -ml-1 mt-6 italic" style={{ background: 'linear-gradient(180deg, #3b82f6 0%, #a855f7 45%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 4px 0px #0f172a) drop-shadow(0px 8px 12px rgba(0,0,0,0.4))', lineHeight: '1' }}>IN</span>
  </div>
);

// --- TELAS ---

const CreateLinkScreen = ({ user, onNext, setToast }) => {
  const [handle, setHandle] = useState('@');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!handle.trim() || handle === '@' || !user) return;
    setHandle(prev => prev.trim());
    setLoading(true);
    try {
      const cleanHandle = handle.trim().replace('@', '');
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userRef, { uid: user.uid, handle: cleanHandle, createdAt: new Date().toISOString() }, { merge: true });
      onNext(2); 
    } catch (err) { 
      console.error(err);
      setToast("Erro ao salvar perfil. Verifique sua conexão.");
    } finally { setLoading(false); }
  };

  const onHandleChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('@')) {
      val = '@' + val.replace(/^@*/, '');
    }
    setHandle(val);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#18181b] overflow-y-auto">
      <BrowserWarning />
      <div className="absolute top-[-15%] left-[-20%] w-[70%] h-[70%] bg-pink-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay" style={{ backgroundImage: `repeating-linear-gradient(105deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)` }} />
      <div className="relative z-10 flex flex-col min-h-screen p-8 animate-in fade-in duration-500">
        <header className="pt-6 pb-2 flex justify-center"><OffinLogo scale={0.8} /></header>
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] italic">Segredos <br /> Anônimos 👀</h2>
            <p className="text-lg text-slate-300 font-medium px-4">Cria o teu link, coloca no Story e deixa a curiosidade fazer o resto.</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <div className="relative shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-2xl">
              <input 
                type="text" 
                placeholder="@seu_instagram" 
                value={handle} 
                onChange={onHandleChange}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-md placeholder:text-slate-500" 
              />
            </div>
            <Button onClick={handleCreateProfile} loading={loading} disabled={!handle || handle === '@' || !user}>Gerar Meu Link</Button>
            <Button onClick={() => onNext(4)} variant="ghost" className="!text-cyan-100 opacity-80">Já tenho conta (Entrar no Radar)</Button>
          </div>
        </main>
      </div>
    </div>
  );
};

const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (user?.uid) {
      setShareLink(`${APP_URL}?u=${user.uid}`);
    }
  }, [user]);

  const handleCopy = () => {
    if (!shareLink) return;
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 2000); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] animate-in slide-in-from-right duration-300 overflow-y-auto">
      <header className="pt-4 pb-2 flex justify-center"><OffinLogo scale={0.65} /></header>
      <main className="flex-1 flex flex-col items-center justify-start p-6 space-y-6 pb-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">A armadilha tá pronta!</h2>
          <p className="text-slate-400 font-medium text-sm italic">Posta agora o link no teu Story.</p>
        </div>
        <div className="w-full max-w-sm bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 space-y-6 shadow-2xl backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(236,72,153,0.5)]">1</span>
              <p className="text-white font-bold text-sm">Tira um print desta imagem 👇</p>
            </div>
            <div className="aspect-[9/16] w-full max-w-[220px] mx-auto bg-gradient-to-br from-cyan-400 to-pink-500 rounded-[2rem] p-6 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden border-[6px] border-slate-950">
              <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />
              <div className="space-y-4 text-center z-10 mt-6">
                <Ghost size={48} className="mx-auto opacity-90 drop-shadow-lg" />
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                  <p className="font-black text-xl leading-tight text-white uppercase tracking-tighter italic drop-shadow-sm">Mandem-me segredos anônimos! 👀</p>
                </div>
              </div>
              <div className="z-10 mb-4 flex flex-col items-center">
                <div className="bg-white text-slate-900 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl italic tracking-tighter">🔗 offin.link/radar</div>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-slate-800/60" />
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.5)]">2</span>
              <p className="text-white font-bold text-sm">Copia o teu link pessoal</p>
            </div>
            <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'} className="py-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]" disabled={!shareLink}>
              {copied ? 'Link Copiado!' : 'Copiar Link e Abrir Radar'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const SendSecretScreen = ({ targetUid, user, onReset, setToast }) => {
  const [targetHandle, setTargetHandle] = useState('...');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchTarget = async () => {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setTargetHandle(docSnap.data().handle);
    };
    if (targetUid) fetchTarget();
  }, [targetUid]);

  const sendToDB = async (currentUser) => {
    const msgId = crypto.randomUUID();
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await setDoc(msgRef, {
        id: msgId, targetUid, senderUid: currentUser.uid,
        senderName: currentUser.displayName || 'Anônimo',
        senderPhoto: currentUser.photoURL || '',
        text: message.trim(), createdAt: new Date().toISOString(), 
        isRevealed: false,
        status: 'sent' // sent -> viewed -> revealed
      });
      setSent(true);
    } catch (err) { setToast("Erro ao enviar segredo."); } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setLoading(true);
    if (user.isAnonymous) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        try {
          const result = await linkWithPopup(user, provider);
          await sendToDB(result.user);
        } catch (linkErr) {
          if (linkErr.code === 'auth/popup-blocked') {
            setToast("O navegador bloqueou o login. Tenta clicar novamente ou abrir no Chrome/Safari.");
            setLoading(false);
          } else {
            const result = await signInWithPopup(auth, provider);
            await sendToDB(result.user);
          }
        }
      } catch (error) { 
        setLoading(false); 
        setToast(`Falha: ${error.code}`);
      }
    } else { await sendToDB(user); }
  };

  if (sent) return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8 text-center animate-in zoom-in overflow-y-auto">
      <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight italic">Segredo Enviado! 🤫</h2>
      <p className="text-slate-500">@{targetHandle} só saberá quem és tu se aceitar o desafio viral.</p>
      <Button onClick={onReset} className="mt-8 max-w-xs mx-auto">Criar o Meu Link Também</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 overflow-y-auto">
      <BrowserWarning />
      <header className="pt-4 pb-2 flex justify-center"><OffinLogo scale={0.65} /></header>
      <main className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
        <h2 className="text-3xl font-extrabold text-white leading-tight italic">Mandar segredo para @{targetHandle}</h2>
        <div className="w-full max-w-xs space-y-4">
          <textarea placeholder="Escreve algo que ninguém saiba..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={150} className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium" />
          <Button onClick={handleSend} loading={loading} disabled={!message.trim()} variant="primary">
            {user?.isAnonymous ? 'Assinar e Enviar' : 'Enviar Segredo'}
          </Button>
        </div>
      </main>
    </div>
  );
};

const InboxScreen = ({ user, onSelectMessage, onBack, setToast }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'

  useEffect(() => {
    if (!user) return;
    const msgRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubscribe = onSnapshot(msgRef, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const receivedMsgs = messages.filter(m => m.targetUid === user.uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sentMsgs = messages.filter(m => m.senderUid === user.uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleLinkGoogle = async () => {
    if (!user) return;
    setLinking(true);
    try { 
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await linkWithPopup(user, provider);
      setToast("Conta sincronizada com sucesso!", "success");
    } catch (e) { 
      if (e.code === 'auth/popup-blocked') {
        setToast("Popup bloqueado. Clica novamente ou usa o navegador externo.");
      } else {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }
    } finally { setLinking(false); }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      sent: { label: 'Enviado', color: 'bg-slate-100 text-slate-600', icon: Send },
      viewed: { label: 'Visto', color: 'bg-cyan-100 text-cyan-600', icon: Clock },
      revealed: { label: 'Revelado', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 }
    };
    const s = config[status] || config.sent;
    return (
      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 ${s.color}`}>
        <s.icon size={10} /> {s.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-400 p-2"><ChevronLeft /></button>
        <h1 className="font-bold text-slate-800 text-lg italic tracking-tight">OFF<span className="text-cyan-500">in</span> Radar</h1>
        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden shadow-sm">
          <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Perfil" />
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white flex p-1 mx-6 mt-4 rounded-xl border border-slate-200">
        <button 
          onClick={() => setActiveTab('received')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'received' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400'}`}
        >
          <Inbox size={14} /> Recebidos ({receivedMsgs.length})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'sent' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400'}`}
        >
          <Send size={14} /> Enviados ({sentMsgs.length})
        </button>
      </div>

      <main className="flex-1 p-6 space-y-4 pb-12">
        {user?.isAnonymous && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-5 rounded-[2rem] space-y-3">
            <p className="text-xs font-bold text-yellow-800 leading-tight">Conta Temporária! Salva os teus segredos agora para não os perderes.</p>
            <Button onClick={handleLinkGoogle} loading={linking} variant="primary" className="!py-2 !text-xs !rounded-xl shadow-none">
              <Globe size={14} /> Sincronizar com Google
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div>
        ) : (
          (activeTab === 'received' ? receivedMsgs : sentMsgs).length === 0 ? (
            <div className="text-center py-20">
              <Ghost size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nada por aqui ainda...</p>
            </div>
          ) : (
            (activeTab === 'received' ? receivedMsgs : sentMsgs).map(msg => (
              <div 
                key={msg.id} 
                onClick={() => activeTab === 'received' && onSelectMessage(msg)}
                className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all ${activeTab === 'received' ? 'cursor-pointer active:scale-95' : 'opacity-80'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={msg.status} />
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="italic text-slate-700 font-serif text-lg leading-relaxed">"{msg.text}"</p>
                {activeTab === 'received' && !msg.isRevealed && (
                  <p className="mt-4 text-[10px] text-cyan-500 font-black flex items-center gap-1 uppercase tracking-wider">
                    Revelar Quem Mandou <ArrowRight size={12} />
                  </p>
                )}
                {activeTab === 'sent' && (
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-medium">Destinatário: <span className="text-slate-600 font-bold tracking-tight">Anônimo</span></p>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </main>
    </div>
  );
};

const ViralPaywallScreen = ({ user, message, onUnlock, onBack }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => { 
    if (message.isRevealed) onUnlock(); 
    // Atualizar status para visualizado ao entrar na tela
    const markAsViewed = async () => {
      if (message.status === 'sent') {
        const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id);
        await updateDoc(msgRef, { status: 'viewed' });
      }
    };
    markAsViewed();
  }, [message]);

  const handlePaywall = async () => {
    if (!user) return;
    const shareLink = `${APP_URL}?u=${user.uid}`;
    copyToClipboardFallback(shareLink);
    setCopied(true);
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id);
      await updateDoc(msgRef, { isRevealed: true, status: 'revealed' });
      setTimeout(() => onUnlock(), 1500);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white p-8 animate-in slide-in-from-bottom text-center justify-center space-y-12 overflow-y-auto">
      <Lock size={64} className="text-pink-500 mx-auto animate-pulse" />
      <div className="space-y-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic italic">Quem mandou?</h2>
        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700">
          <p className="italic text-xl text-slate-100 font-serif">"{message.text}"</p>
        </div>
      </div>
      <div className="bg-cyan-900/30 border border-cyan-500/50 p-8 rounded-[2.5rem] space-y-6">
        <p className="text-sm font-bold text-cyan-100 leading-relaxed italic">Para veres a identidade, precisas de passar a corrente adiante copiando o teu link!</p>
        <Button onClick={handlePaywall} icon={copied ? Unlock : Copy} variant={copied ? 'success' : 'primary'}>
          {copied ? 'A Revelar...' : 'Copiar Link e Revelar'}
        </Button>
      </div>
    </div>
  );
};

const RevealScreen = ({ message, onBack }) => {
  const [isHolding, setIsHolding] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-black p-8 animate-in zoom-in duration-300 text-center justify-center space-y-12 overflow-y-auto">
      <header className="absolute top-8 left-8 z-20"><button onClick={onBack} className="p-3 bg-slate-900 rounded-full text-slate-400"><ChevronLeft size={24} /></button></header>
      <div className="bg-slate-900 rounded-[3.5rem] p-10 relative shadow-2xl border border-slate-800 min-h-[400px] flex flex-col justify-center select-none touch-none">
        {isHolding ? (
          <div className="animate-in fade-in zoom-in duration-200 space-y-6">
            <div className="w-32 h-32 rounded-full mx-auto border-4 border-cyan-500 overflow-hidden shadow-2xl shadow-cyan-500/20">
              <img src={message.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderUid}`} className="w-full h-full object-cover" />
            </div>
            <p className="text-3xl font-black italic tracking-tighter text-white">{message.senderName}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ShieldCheck size={72} className="mx-auto text-cyan-500 animate-pulse" />
            <p className="font-black text-lg text-white uppercase tracking-tight">Segura o botão para ver</p>
          </div>
        )}
      </div>
      <button 
        onMouseDown={() => setIsHolding(true)} onMouseUp={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)} onTouchEnd={() => setIsHolding(false)}
        className={`w-full py-8 rounded-full font-black text-xl transition-all select-none touch-none ${isHolding ? 'bg-cyan-700 scale-95 shadow-inner' : 'bg-cyan-500 text-white shadow-2xl shadow-cyan-500/30'}`}
      >
        {isHolding ? 'A MOSTRAR...' : '👆 PRESSIONA E SEGURA'}
      </button>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState(1);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [targetUid, setTargetUid] = useState(null); 
  const [selectedMessage, setSelectedMessage] = useState(null); 
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToast(msg);
    setToastType(type);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Erro crítico na autenticação:", err); 
      } finally { 
        setLoadingAuth(false); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loadingAuth && user) {
      const u = new URLSearchParams(window.location.search).get('u');
      if (u) {
        if (u === user.uid) {
          setScreen(4);
        } else {
          setTargetUid(u);
          setScreen(3); 
        }
      }
    }
  }, [loadingAuth, user]);

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-white" size={32} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OFFin Network...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased overflow-y-auto">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        {screen === 1 && <CreateLinkScreen user={user} onNext={setScreen} setToast={showToast} />}
        {screen === 2 && <LinkReadyScreen user={user} onNext={setScreen} />}
        {screen === 3 && targetUid && <SendSecretScreen targetUid={targetUid} user={user} onReset={() => setScreen(1)} setToast={showToast} />}
        {screen === 4 && <InboxScreen user={user} onBack={() => setScreen(1)} onSelectMessage={msg => { setSelectedMessage(msg); setScreen(5); }} setToast={showToast} />}
        {screen === 5 && selectedMessage && <ViralPaywallScreen user={user} message={selectedMessage} onBack={() => setScreen(4)} onUnlock={() => setScreen(6)} />}
        {screen === 6 && selectedMessage && <RevealScreen message={selectedMessage} onBack={() => setScreen(4)} />}
      </div>
      <Toast message={toast} type={toastType} onClose={() => setToast(null)} />
    </div>
  );
}
