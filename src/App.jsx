import React, { useState, useEffect, useRef } from 'react';
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
  Download,
  Image as ImageIcon
} from 'lucide-react';

/**
 * PROJETO OFFIN - VERSÃO DE PRODUÇÃO V4
 * Foco: Autenticação simplificada, Identidade Visual e Geração de Imagem para Story
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

const isInstagramBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (ua.indexOf('Instagram') > -1) || (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1);
};

const getCurrentAppUrl = () => {
  const origin = window.location.origin;
  const path = window.location.pathname;
  if (path.includes('app.html') || path === '/app') return origin + path;
  return origin + '/app.html';
};

const APP_URL = getCurrentAppUrl();

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

// --- FUNÇÃO PARA GERAR E DESCARREGAR IMAGEM ---
const downloadStoryImage = (handle) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // Fundo Gradiente
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Círculos de Neon Decorativos
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(100, 100, 300, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(980, 1820, 250, 0, Math.PI * 2);
  ctx.stroke();

  // Logo OFF
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 180px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
  ctx.shadowBlur = 50;
  ctx.fillText('OFF', 540, 450);
  
  // Texto IN (Gradiente Simulando)
  ctx.fillStyle = '#ec4899';
  ctx.font = 'black 160px Inter, sans-serif';
  ctx.fillText('IN', 540, 600);
  ctx.shadowBlur = 0;

  // Caixa de Segredos
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.roundRect(140, 800, 800, 400, 60);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 60px Inter, sans-serif';
  ctx.fillText('MANDEM-ME SEGREDOS', 540, 960);
  ctx.font = '400 45px Inter, sans-serif';
  ctx.fillText('ANÓNIMOS 👀', 540, 1040);

  // Instrução do Link
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 50px Inter, sans-serif';
  ctx.fillText('👇 COLE O MEU LINK AQUI 👇', 540, 1450);

  // User handle
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '40px Inter, sans-serif';
  ctx.fillText(`@${handle}`, 540, 1800);

  // Download
  const link = document.createElement('a');
  link.download = `offin-story-${handle}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

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
      ESTÁS NO INSTAGRAM. CLICA EM "..." E "ABRIR NO NAVEGADOR" PARA O LOGIN FUNCIONAR.
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', icon: Icon, disabled, loading, className = '' }) => {
  const base = 'w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-cyan-500 text-white shadow-lg shadow-cyan-100/30',
    secondary: 'bg-slate-800 text-slate-300 border border-slate-700',
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
        <text x="175" y="95" fontFamily="sans-serif" fontSize="75" fontWeight="900" fontStyle="italic" fill="none" stroke="url(#gradNeon)" strokeWidth="3.5" transform="rotate(15 175 95)">?</text>
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
    setLoading(true);
    try {
      const cleanHandle = handle.trim().replace('@', '');
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userRef, { uid: user.uid, handle: cleanHandle, createdAt: new Date().toISOString() }, { merge: true });
      onNext(2); 
    } catch (err) { 
      setToast("Erro ao salvar perfil.");
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#18181b] overflow-y-auto">
      <BrowserWarning />
      <div className="absolute top-[-15%] left-[-20%] w-[70%] h-[70%] bg-pink-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="relative z-10 flex flex-col min-h-screen p-8 animate-in fade-in duration-500">
        <header className="pt-6 pb-2 flex justify-center"><OffinLogo scale={0.8} /></header>
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-tight italic">Segredos <br /> Anónimos 👀</h2>
            <p className="text-lg text-slate-300 font-medium px-4">Descobre o que pensam de ti sem que ninguém saiba quem mandou.</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <input 
              type="text" 
              placeholder="@teu_instagram" 
              value={handle} 
              onChange={(e) => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value.replace('@',''))}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-md placeholder:text-slate-500" 
            />
            <Button onClick={handleCreateProfile} loading={loading} disabled={!handle || handle === '@' || !user}>Gerar Meu Link</Button>
            <Button onClick={() => onNext(4)} variant="ghost" className="!text-cyan-100 opacity-80">Já tenho conta (Radar)</Button>
          </div>
        </main>
      </div>
    </div>
  );
};

const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [handle, setHandle] = useState('');

  useEffect(() => {
    if (user?.uid) {
      setShareLink(`${APP_URL}?u=${user.uid}`);
      getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid)).then(d => {
        if (d.exists()) setHandle(d.data().handle);
      });
    }
  }, [user]);

  const handleCopy = () => {
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 2000); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] animate-in slide-in-from-right duration-300 overflow-y-auto">
      <header className="pt-4 pb-2 flex justify-center"><OffinLogo scale={0.65} /></header>
      <main className="flex-1 flex flex-col items-center justify-start p-6 space-y-6 pb-12 text-center">
        <h2 className="text-2xl font-extrabold text-white">Pronto a Viralizar! 🚀</h2>
        
        <div className="w-full max-w-sm bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 space-y-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 justify-center mb-2">
            <span className="bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs">1</span>
            <p className="text-white font-bold text-sm">Descarrega a imagem para o Story</p>
          </div>
          
          <Button onClick={() => downloadStoryImage(handle)} variant="secondary" icon={Download}>
            Descarregar Template
          </Button>

          <div className="h-px w-full bg-slate-800/60" />

          <div className="flex items-center gap-3 justify-center">
            <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs">2</span>
            <p className="text-white font-bold text-sm">Copia o link para colar no Story</p>
          </div>
          
          <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'}>
            {copied ? 'Link Copiado!' : 'Copiar Link e Abrir Radar'}
          </Button>
        </div>
        
        <p className="text-slate-500 text-xs px-8 leading-relaxed">
          Dica: Ao publicar no Instagram, seleciona o adesivo de <b>LINK</b> e cola o endereço que copiaste por cima da área indicada na imagem.
        </p>
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

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setLoading(true);

    const performSend = async (currentUser) => {
      const msgId = crypto.randomUUID();
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await setDoc(msgRef, {
        id: msgId, targetUid, senderUid: currentUser.uid,
        senderName: currentUser.displayName || 'Anónimo',
        senderPhoto: currentUser.photoURL || '',
        text: message.trim(), createdAt: new Date().toISOString(), 
        isRevealed: false, status: 'sent'
      });
      setSent(true);
      setLoading(false);
    };

    if (user.isAnonymous) {
      try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await performSend(result.user);
      } catch (error) {
        setLoading(false);
        setToast(error.code === 'auth/popup-blocked' ? "Janela bloqueada! Clica de novo." : "Erro na autenticação.");
      }
    } else {
      await performSend(user);
    }
  };

  if (sent) return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8 text-center animate-in zoom-in overflow-y-auto">
      <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight italic">Enviado! 🤫</h2>
      <p className="text-slate-500">@{targetHandle} só saberá quem és se cumprir o desafio.</p>
      <Button onClick={onReset} className="mt-8 max-w-xs mx-auto">Criar o Meu Link</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 overflow-y-auto">
      <BrowserWarning />
      <header className="pt-4 pb-2 flex justify-center"><OffinLogo scale={0.65} /></header>
      <main className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
        <h2 className="text-3xl font-extrabold text-white leading-tight italic">Mandar segredo para @{targetHandle}</h2>
        <div className="w-full max-w-xs space-y-4">
          <textarea placeholder="Escreve algo curioso..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={150} className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium" />
          <Button onClick={handleSend} loading={loading} disabled={!message.trim()}>
            {user?.isAnonymous ? 'Sincronizar e Enviar' : 'Enviar Segredo'}
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
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (!user) return;
    const msgRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    return onSnapshot(msgRef, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, [user]);

  const receivedMsgs = messages.filter(m => m.targetUid === user.uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sentMsgs = messages.filter(m => m.senderUid === user.uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleGoogleAuth = async () => {
    setLinking(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      setToast("Conta sincronizada!", "success");
    } catch (e) {
      setToast(e.code === 'auth/popup-blocked' ? "Janela bloqueada! Tenta de novo." : "Erro ao entrar.");
    } finally { setLinking(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-400 p-2"><ChevronLeft /></button>
        <div className="flex flex-col items-center">
           <h1 className="font-bold text-slate-800 text-lg italic tracking-tight">OFF<span className="text-cyan-500">in</span> Radar</h1>
           {!user?.isAnonymous && <span className="text-[10px] text-slate-400 font-bold">{user.displayName}</span>}
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden shadow-sm">
          <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Perfil" />
        </div>
      </header>

      <div className="bg-white flex p-1 mx-6 mt-4 rounded-xl border border-slate-200">
        <button onClick={() => setActiveTab('received')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'received' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400'}`}>
          <Inbox size={14} /> Recebidos ({receivedMsgs.length})
        </button>
        <button onClick={() => setActiveTab('sent')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'sent' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400'}`}>
          <Send size={14} /> Enviados ({sentMsgs.length})
        </button>
      </div>

      <main className="flex-1 p-6 space-y-4 pb-12">
        {user?.isAnonymous && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-5 rounded-[2rem] space-y-3">
            <p className="text-xs font-bold text-yellow-800 leading-tight">Salva os teus segredos agora para não os perderes.</p>
            <Button onClick={handleGoogleAuth} loading={linking} className="!py-2 !text-xs !rounded-xl shadow-none">
              <Globe size={14} /> Sincronizar com Google
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div>
        ) : (
          (activeTab === 'received' ? receivedMsgs : sentMsgs).length === 0 ? (
            <div className="text-center py-20 opacity-20"><Ghost size={60} className="mx-auto" /></div>
          ) : (
            (activeTab === 'received' ? receivedMsgs : sentMsgs).map(msg => (
              <div key={msg.id} onClick={() => activeTab === 'received' && onSelectMessage(msg)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${msg.isRevealed ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>{msg.isRevealed ? 'Revelado' : 'Trancado'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="italic text-slate-700 font-serif text-lg leading-relaxed">"{msg.text}"</p>
                {activeTab === 'sent' && <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Estado: {msg.status === 'revealed' ? 'Visto' : 'Enviado'}</p>}
              </div>
            ))
          )
        )}
      </main>
    </div>
  );
};

const ViralPaywallScreen = ({ user, message, onUnlock }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => { 
    if (message.isRevealed) onUnlock(); 
    if (message.status === 'sent') updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id), { status: 'viewed' });
  }, [message]);

  const handlePaywall = async () => {
    const shareLink = `${APP_URL}?u=${user.uid}`;
    copyToClipboardFallback(shareLink);
    setCopied(true);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id), { isRevealed: true, status: 'revealed' });
    setTimeout(() => onUnlock(), 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white p-8 text-center justify-center space-y-12 overflow-y-auto">
      <Lock size={64} className="text-pink-500 mx-auto animate-pulse" />
      <h2 className="text-3xl font-black italic">QUEM MANDOU?</h2>
      <div className="bg-slate-800 p-8 rounded-[2.5rem]"><p className="italic text-xl">"{message.text}"</p></div>
      <div className="bg-cyan-900/30 border border-cyan-500/50 p-8 rounded-[2.5rem] space-y-6">
        <p className="text-sm font-bold italic">Passa a corrente adiante para revelares a identidade!</p>
        <Button onClick={handlePaywall} icon={copied ? Unlock : Copy} variant={copied ? 'success' : 'primary'}>{copied ? 'A Revelar...' : 'Copiar Link e Revelar'}</Button>
      </div>
    </div>
  );
};

const RevealScreen = ({ message, onBack }) => {
  const [isHolding, setIsHolding] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-black p-8 text-center justify-center space-y-12 overflow-y-auto">
      <header className="absolute top-8 left-8"><button onClick={onBack} className="p-3 bg-slate-900 rounded-full text-slate-400"><ChevronLeft size={24} /></button></header>
      <div className="bg-slate-900 rounded-[3.5rem] p-10 relative shadow-2xl min-h-[400px] flex flex-col justify-center select-none touch-none">
        {isHolding ? (
          <div className="animate-in fade-in space-y-6">
            <div className="w-32 h-32 rounded-full mx-auto border-4 border-cyan-500 overflow-hidden">
              <img src={message.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderUid}`} className="w-full h-full object-cover" />
            </div>
            <p className="text-3xl font-black italic text-white leading-tight">{message.senderName}</p>
          </div>
        ) : (
          <div className="space-y-6"><ShieldCheck size={72} className="mx-auto text-cyan-500 animate-pulse" /><p className="font-black text-lg text-white uppercase">Segura para ver</p></div>
        )}
      </div>
      <button 
        onMouseDown={() => setIsHolding(true)} onMouseUp={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)} onTouchEnd={() => setIsHolding(false)}
        className={`w-full py-8 rounded-full font-black text-xl transition-all select-none touch-none ${isHolding ? 'bg-cyan-700 scale-95' : 'bg-cyan-500 text-white shadow-2xl'}`}
      >
        {isHolding ? 'MOSTRANDO...' : '👆 PRESSIONA E SEGURA'}
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
        await signInAnonymously(auth);
      } catch (err) { console.error(err); } finally { setLoadingAuth(false); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!loadingAuth && user) {
      const u = new URLSearchParams(window.location.search).get('u');
      if (u) {
        if (u === user.uid) setScreen(4);
        else { setTargetUid(u); setScreen(3); }
      }
    }
  }, [loadingAuth, user]);

  if (loadingAuth) return <div className="min-h-screen bg-[#18181b] flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

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
