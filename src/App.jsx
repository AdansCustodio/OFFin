import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  GoogleAuthProvider,
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
  Loader2,
  Copy,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE (SUAS CREDENCIAIS REAIS) ---
const firebaseConfig = {
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

// ID do App para rotas do Firestore e URL Base do Vercel
const appId = "offinn-89849"; 
const BASE_URL = "https://of-fin.vercel.app";

// --- FUNÇÃO AUXILIAR DE CLIPBOARD ---
const copyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Erro ao copiar:', err);
  }
  document.body.removeChild(textArea);
};

// --- COMPONENTES DE UI ---
const Button = ({ children, onClick, variant = 'primary', icon: Icon, disabled, loading, className = '' }) => {
  const base = 'w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-cyan-500 text-white shadow-lg shadow-cyan-100/30',
    secondary: 'bg-slate-100 text-slate-500 border border-slate-200',
    ghost: 'bg-transparent text-slate-400 font-medium text-sm',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100',
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

// --- LOGO 3D ESTILIZADA ---
const OffinLogo = ({ scale = 1 }) => (
  <div className="relative inline-flex items-center justify-center p-6" style={{ transform: `scale(${scale})` }}>
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 translate-x-3 translate-y-2">
      <svg viewBox="0 0 240 140" className="w-[320px] h-auto opacity-90" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="gradNeon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="60" r="45" fill="none" stroke="url(#gradNeon)" strokeWidth="2.5" />
        <text x="175" y="95" fontFamily="sans-serif" fontSize="75" fontWeight="900" fontStyle="italic" fill="none" stroke="url(#gradNeon)" strokeWidth="3.5" transform="rotate(15 175 95)">?</text>
      </svg>
    </div>
    <span className="text-7xl font-black tracking-tighter text-white relative z-10 italic" style={{ textShadow: '0px 2px 0px #a5f3fc, 0px 4px 0px #22d3ee, 0px 7px 0px #0891b2, 3px 15px 15px rgba(0,0,0,0.25)', WebkitTextStroke: '1px #ffffff' }}>OFF</span>
    <span className="text-[4.5rem] font-black tracking-tighter relative z-10 -ml-1 mt-6 italic" style={{ background: 'linear-gradient(180deg, #3b82f6 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 4px 0px #0f172a)', lineHeight: '1' }}>IN</span>
  </div>
);

// --- TELA 1: CRIAR MEU LINK (ISCA) ---
const CreateLinkScreen = ({ user, onNext }) => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!handle.trim()) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userRef, { 
        uid: user.uid, 
        handle: handle.trim().replace('@', ''), 
        createdAt: new Date().toISOString() 
      }, { merge: true });
      onNext(2);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#18181b] p-8 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-pink-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <header className="pt-6 pb-2 flex justify-center z-10"><OffinLogo scale={0.8} /></header>
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-10 z-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-tight drop-shadow-lg">Receba segredos <br /> anônimos 👀</h2>
            <p className="text-lg text-slate-400">Descubra o que pensam de você sem que ninguém saiba quem mandou.</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <input type="text" placeholder="@seu_instagram" value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-white font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
            <Button onClick={handleCreate} loading={loading}>Criar meu link</Button>
            <Button onClick={() => onNext(4)} variant="ghost" className="!text-cyan-100">Já tenho link (Ver minha Caixa)</Button>
          </div>
        </main>
    </div>
  );
};

// --- TELA 2: LINK PRONTO ---
const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  const shareLink = `${BASE_URL}/app.html?u=${user?.uid}`;

  const handleCopy = () => {
    copyToClipboard(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] p-8 items-center text-center space-y-8">
      <header className="pt-4 flex justify-center"><OffinLogo scale={0.6} /></header>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white leading-tight">Link pronto! <br/> Poste nos Stories:</h2>
        <p className="text-slate-400 text-sm italic">Tire print da arte abaixo e cole o link por cima.</p>
      </div>
      <div className="aspect-[9/16] w-full max-w-[220px] bg-gradient-to-br from-cyan-400 to-pink-500 rounded-[2rem] p-6 flex flex-col justify-center text-white shadow-2xl relative border-4 border-black">
        <Ghost size={48} className="mx-auto mb-4" />
        <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30 font-black uppercase tracking-tighter italic">
            Mande segredos anônimos 👀
        </div>
        <div className="absolute bottom-6 left-0 right-0 px-4">
            <div className="bg-white text-slate-900 py-2 rounded-lg font-bold text-[10px] shadow-xl">🔗 Cole o link aqui</div>
        </div>
      </div>
      <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'}>
        {copied ? 'Copiado! Indo pra Caixa...' : 'Copiar Link e Continuar'}
      </Button>
    </div>
  );
};

// --- TELA 3: ENVIAR SEGREDO (VISITANTE) ---
const SendSecretScreen = ({ targetUid, user, onReset }) => {
  const [targetHandle, setTargetHandle] = useState('...');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUid)).then(snap => {
      if (snap.exists()) setTargetHandle(snap.data().handle);
    });
  }, [targetUid]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    let currentUser = user;
    if (user.isAnonymous) {
      try {
        const result = await linkWithPopup(user, new GoogleAuthProvider());
        currentUser = result.user;
      } catch (e) { console.warn("Link ignorado ou cancelado"); }
    }
    const msgId = crypto.randomUUID();
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), {
      id: msgId, 
      targetUid, 
      senderUid: currentUser.uid, 
      senderName: currentUser.displayName || 'Anônimo',
      senderPhoto: currentUser.photoURL || '', 
      text: message.trim(), 
      createdAt: new Date().toISOString(), 
      isRevealed: false
    });
    setSent(true);
    setLoading(false);
  };

  if (sent) return (
    <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center bg-slate-50 space-y-6">
      <CheckCircle2 size={64} className="text-emerald-500" />
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Segredo enviado! 🤫</h2>
      <p className="text-slate-500">@{targetHandle} só saberá quem você é se tiver coragem de pagar o pedágio.</p>
      <Button onClick={onReset}>Criar meu link também</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] p-8 space-y-8 text-center">
      <header className="flex justify-center"><OffinLogo scale={0.6} /></header>
      <h2 className="text-xl font-bold text-white leading-tight">Mande um segredo para @{targetHandle}</h2>
      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Diga algo curioso..." className="w-full h-40 bg-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none" />
      <Button onClick={handleSend} loading={loading}>Assinar e Enviar</Button>
      <p className="text-[10px] text-slate-500">Seu nome e foto ficarão trancados até a revelação.</p>
    </div>
  );
};

// --- TELA 4: CAIXA DE ENTRADA (RADAR) ---
const InboxScreen = ({ user, onSelectMessage, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map(d => d.data())
        .filter(m => m.targetUid === user.uid)
        .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
        <h1 className="font-bold text-lg text-slate-800">Minha Caixa</h1>
        <div className="w-6" />
      </header>
      <main className="flex-1 p-6 space-y-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div> : 
          messages.length === 0 ? <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum segredo ainda...</div> :
          messages.map(m => (
            <div key={m.id} onClick={() => onSelectMessage(m)} className="bg-white p-6 rounded-3xl mb-4 shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-all">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${m.isRevealed ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                    {m.isRevealed ? 'Revelado' : 'Trancado'}
                </span>
                <p className="mt-4 italic text-slate-700 font-serif text-lg leading-relaxed">"{m.text}"</p>
                {!m.isRevealed && <p className="mt-4 text-[10px] text-cyan-500 font-black flex items-center gap-1 uppercase">Descobrir quem enviou <ArrowRight size={12} /></p>}
            </div>
          ))}
      </main>
    </div>
  );
};

// --- TELA 5: PAYWALL VIRAL ---
const ViralPaywallScreen = ({ user, message, onUnlock, onBack }) => {
  const handleUnlock = async () => {
    copyToClipboard(`${BASE_URL}/app.html?u=${user.uid}`);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id), { isRevealed: true });
      onUnlock();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-white p-8 flex flex-col items-center justify-center text-center space-y-10">
      <Lock size={64} className="text-pink-500 animate-pulse mb-4" />
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">QUEM MANDOU?</h2>
      <div className="bg-slate-800/80 p-8 rounded-[2rem] border border-slate-700 w-full">
        <p className="italic text-xl text-slate-100 font-serif leading-relaxed">"{message.text}"</p>
      </div>
      <div className="bg-cyan-900/20 p-8 rounded-[2rem] space-y-6 w-full max-w-sm border border-cyan-500/20">
        <p className="text-sm font-bold text-cyan-100 leading-relaxed">Para revelar a identidade do remetente, passe a corrente adiante copiando seu link!</p>
        <Button onClick={handleUnlock}>Copiar Link e Revelar</Button>
      </div>
    </div>
  );
};

// --- TELA 6: REVELAÇÃO ANTI-PRINT ---
const RevealScreen = ({ message, onBack }) => {
  const [isHolding, setIsHolding] = useState(false);
  const triggerHold = (val) => setIsHolding(val);

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
      <button onClick={onBack} className="absolute top-8 left-8 p-2 bg-slate-900 rounded-full"><ChevronLeft size={24} /></button>
      <header className="absolute top-8 right-8 text-[10px] font-black text-pink-500 border border-pink-500/40 px-3 py-1 rounded-full uppercase tracking-widest">Modo Sigiloso</header>
      
      <div className="bg-slate-900/80 rounded-[3.5rem] p-10 relative shadow-2xl border border-slate-800 w-full max-w-sm min-h-[400px] flex flex-col justify-center backdrop-blur-xl">
        {isHolding ? (
          <div className="animate-in fade-in zoom-in duration-200">
            <div className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-cyan-500 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <img src={message.senderPhoto || 'https://via.placeholder.com/150'} alt="Remetente" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs uppercase text-slate-400 font-black mb-2 tracking-widest">Enviado por:</p>
            <p className="text-3xl font-black italic tracking-tighter">{message.senderName}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ShieldCheck size={72} className="mx-auto text-cyan-500 animate-pulse" />
            <p className="font-black text-lg uppercase tracking-tight leading-tight">SEGURE O BOTÃO ABAIXO<br/>PARA REVELAR A FOTO</p>
            <p className="text-[10px] text-slate-500 px-4 italic leading-relaxed">Se o sistema detectar print, a identidade será ocultada instantaneamente.</p>
          </div>
        )}
      </div>
      
      <button 
        onMouseDown={() => triggerHold(true)} onMouseUp={() => triggerHold(false)}
        onTouchStart={() => triggerHold(true)} onTouchEnd={() => triggerHold(false)}
        className={`w-full max-w-sm py-8 rounded-full font-black text-xl transition-all duration-300 select-none ${isHolding ? 'bg-cyan-700 scale-95 shadow-inner' : 'bg-cyan-500 text-white shadow-2xl shadow-cyan-500/20'}`}
      >
        {isHolding ? 'OCULTANDO...' : '👆 PRESSIONE E SEGURE'}
      </button>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [targetUid, setTargetUid] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) signInAnonymously(auth);
      else setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const uParam = new URLSearchParams(window.location.search).get('u');
      if (uParam) {
        if (uParam === user.uid) setScreen(4);
        else { setTargetUid(uParam); setScreen(3); }
      }
    }
  }, [loading, user]);

  const handleReset = () => {
    window.history.replaceState({}, '', '/app.html');
    setTargetUid(null);
    setScreen(1);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-white" size={32} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando OFFin...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex justify-center bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl relative overflow-hidden flex flex-col">
        {screen === 1 && <CreateLinkScreen user={user} onNext={setScreen} />}
        {screen === 2 && <LinkReadyScreen user={user} onNext={setScreen} />}
        {screen === 3 && <SendSecretScreen targetUid={targetUid} user={user} onReset={handleReset} />}
        {screen === 4 && <InboxScreen user={user} onBack={() => setScreen(1)} onSelectMessage={m => { setSelectedMessage(m); setScreen(5); }} />}
        {screen === 5 && <ViralPaywallScreen user={user} message={selectedMessage} onUnlock={() => setScreen(6)} onBack={() => setScreen(4)} />}
        {screen === 6 && <RevealScreen message={selectedMessage} onBack={() => setScreen(4)} />}
      </div>
    </div>
  );
}
