import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
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
  Instagram,
  Loader2,
  Copy,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE E URL ---
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

const appId = "offinn-89849"; 
// Definimos o APP_URL apontando para o arquivo onde o React está injetado
const BASE_URL = "https://of-fin.vercel.app";
const APP_URL = `${BASE_URL}/app.html`;

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
    <span className="text-7xl font-black tracking-tighter text-white relative z-10" style={{ textShadow: '0px 2px 0px #a5f3fc, 0px 4px 0px #22d3ee, 0px 7px 0px #0891b2, 0px 10px 0px #0e7490, 3px 15px 15px rgba(0,0,0,0.25)', WebkitTextStroke: '1px #ffffff' }}>OFF</span>
    <span className="text-[4.5rem] font-black tracking-tighter relative z-10 -ml-1 mt-6" style={{ background: 'linear-gradient(180deg, #3b82f6 0%, #a855f7 45%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 4px 0px #0f172a) drop-shadow(0px 8px 12px rgba(0,0,0,0.4))', lineHeight: '1' }}>IN</span>
  </div>
);

const CreateLinkScreen = ({ user, onNext }) => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!handle.trim() || !user) return;
    setLoading(true);
    try {
      const cleanHandle = handle.trim().replace('@', '');
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userRef, { uid: user.uid, handle: cleanHandle, createdAt: new Date().toISOString() }, { merge: true });
      onNext(2); 
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#18181b]">
      <div className="absolute top-[-15%] left-[-20%] w-[70%] h-[70%] bg-pink-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay" style={{ backgroundImage: `repeating-linear-gradient(105deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)` }} />
      <div className="relative z-10 flex flex-col min-h-screen p-8 animate-in fade-in duration-500">
        <header className="pt-6 pb-2 flex justify-center"><OffinLogo scale={0.8} /></header>
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">Receba segredos <br /> anônimos 👀</h2>
            <p className="text-lg text-slate-300 font-medium px-4">Descubra o que pensam de você sem que ninguém saiba quem mandou.</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <div className="relative shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-2xl">
              <span className="absolute left-4 top-4 text-slate-400 font-bold">@</span>
              <input type="text" placeholder="seu_instagram" value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl py-4 pl-10 pr-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-md placeholder:text-slate-500" />
            </div>
            <Button onClick={handleCreateProfile} loading={loading} disabled={!handle}>Criar meu link</Button>
            <Button onClick={() => onNext(4)} variant="ghost" className="!text-cyan-100 opacity-80">Já tenho link (Ver Caixa)</Button>
          </div>
        </main>
      </div>
    </div>
  );
};

const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  // O link de compartilhamento agora aponta explicitamente para app.html
  const shareLink = `${APP_URL}?u=${user?.uid}`;

  const handleCopy = () => {
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 2000); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] animate-in slide-in-from-right duration-300">
      <header className="pt-4 pb-2 flex justify-center"><OffinLogo scale={0.65} /></header>
      <main className="flex-1 flex flex-col items-center justify-start p-6 space-y-6 overflow-y-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">A armadilha tá pronta!</h2>
          <p className="text-slate-400 font-medium text-sm">Siga os 2 passos abaixo para postar no Instagram.</p>
        </div>
        <div className="w-full max-w-sm bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 space-y-6 shadow-2xl backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(236,72,153,0.5)]">1</span>
              <p className="text-white font-bold text-sm">Tire um print desta imagem 👇</p>
            </div>
            <div className="aspect-[9/16] w-full max-w-[220px] mx-auto bg-gradient-to-br from-cyan-400 to-pink-500 rounded-[2rem] p-6 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden border-[6px] border-slate-950">
              <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />
              <div className="space-y-4 text-center z-10 mt-6">
                <Ghost size={48} className="mx-auto opacity-90 drop-shadow-lg" />
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                  <p className="font-black text-xl leading-tight text-white uppercase tracking-tighter italic drop-shadow-sm">Me mandem segredos anônimos 👀</p>
                </div>
              </div>
              <div className="z-10 mb-4 flex flex-col items-center">
                <div className="bg-white text-slate-900 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl">🔗 offin.link/secreto</div>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-slate-800/60" />
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.5)]">2</span>
              <p className="text-white font-bold text-sm">Copie seu link para colar no adesivo</p>
            </div>
            <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'} className="py-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              {copied ? 'Copiado!' : 'Copiar Link e Continuar'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const SendSecretScreen = ({ targetUid, user, onReset }) => {
  const [targetHandle, setTargetHandle] = useState('...');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchTarget = async () => {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setTargetHandle(docSnap.data().handle);
    };
    fetchTarget();
  }, [targetUid]);

  const sendToDB = async (currentUser) => {
    const msgId = crypto.randomUUID();
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await setDoc(msgRef, {
        id: msgId, targetUid, senderUid: currentUser.uid,
        senderName: currentUser.displayName || 'Anônimo',
        senderPhoto: currentUser.photoURL || '',
        text: message.trim(), createdAt: new Date().toISOString(), isRevealed: false
      });
      setSent(true);
    } catch (err) { setToast("Erro ao enviar."); } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setLoading(true);
    if (user.isAnonymous) {
      try {
        const result = await linkWithPopup(user, new GoogleAuthProvider());
        await sendToDB(result.user);
      } catch (error) { setLoading(false); setToast("Autenticação necessária."); }
    } else { await sendToDB(user); }
  };

  if (sent) return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8 text-center animate-in zoom-in">
      <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Segredo enviado! 🤫</h2>
      <p className="text-slate-500">@{targetHandle} só vai descobrir quem é você se tiver coragem de postar.</p>
      <Button onClick={onReset} className="mt-8 max-w-xs mx-auto">Criar meu link também</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 p-8 animate-in fade-in">
      <header className="pt-4 pb-2 flex justify-center"><OffinLogo scale={0.65} /></header>
      <main className="flex-1 flex flex-col items-center justify-center text-center space-y-8 mt-[-20px]">
        <h2 className="text-3xl font-extrabold text-white leading-tight">Mande um segredo para @{targetHandle}</h2>
        <div className="w-full max-w-xs space-y-4">
          <textarea placeholder="Escreva algo curioso..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={150} className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" />
          {toast && <p className="text-pink-400 text-xs font-bold">{toast}</p>}
          <Button onClick={handleSend} loading={loading} disabled={!message.trim()} variant="primary">
            {user?.isAnonymous ? 'Assinar e Enviar' : 'Enviar Secreto'}
          </Button>
        </div>
      </main>
    </div>
  );
};

const InboxScreen = ({ user, onSelectMessage, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!user) return;
    const msgRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubscribe = onSnapshot(msgRef, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myMsgs = allMsgs.filter(m => m.targetUid === user.uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(myMsgs);
      setLoading(false);
    }, (error) => { setLoading(false); });
    return () => unsubscribe();
  }, [user]);

  const handleLinkGoogle = async () => {
    setLinking(true);
    try { await linkWithPopup(user, new GoogleAuthProvider()); } catch (e) { console.error(e); } finally { setLinking(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="text-slate-400 p-2"><ChevronLeft /></button>
        <h1 className="font-bold text-slate-800 text-lg">Minha Caixa</h1>
        <div className="w-6" />
      </header>
      <main className="flex-1 p-6 space-y-6">
        {user?.isAnonymous && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-3xl flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-yellow-800">Salve sua conta para não perder o acesso!</p>
            </div>
            <button onClick={handleLinkGoogle} disabled={linking} className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-800 shadow-sm border border-slate-200 shrink-0">
              {linking ? 'Salvando...' : 'Salvar com Google'}
            </button>
          </div>
        )}
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div> : 
          messages.length === 0 ? <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum segredo ainda...</div> :
          messages.map(msg => (
            <div key={msg.id} onClick={() => onSelectMessage(msg)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-all">
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${msg.isRevealed ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                {msg.isRevealed ? 'Revelado' : 'Trancado'}
              </span>
              <p className="mt-4 italic text-slate-700 font-serif text-lg leading-relaxed">"{msg.text}"</p>
              {!msg.isRevealed && <p className="mt-4 text-xs text-cyan-500 font-black flex items-center gap-1 uppercase tracking-wider">Revelar identidade <ArrowRight size={14} /></p>}
            </div>
          ))}
      </main>
    </div>
  );
};

const ViralPaywallScreen = ({ user, message, onUnlock, onBack }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (message.isRevealed) onUnlock(); }, [message]);

  const handlePaywall = async () => {
    const shareLink = `${APP_URL}?u=${user.uid}`;
    copyToClipboardFallback(shareLink);
    setCopied(true);
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id);
      await updateDoc(msgRef, { isRevealed: true });
      setTimeout(() => onUnlock(), 1500);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white p-8 animate-in slide-in-from-bottom text-center justify-center space-y-12">
      <Lock size={64} className="text-pink-500 mx-auto animate-pulse" />
      <div className="space-y-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Quem mandou?</h2>
        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700">
          <p className="italic text-xl text-slate-100 font-serif">"{message.text}"</p>
        </div>
      </div>
      <div className="bg-cyan-900/30 border border-cyan-500/50 p-8 rounded-[2.5rem] space-y-6">
        <p className="text-sm font-bold text-cyan-100 leading-relaxed">Para revelar a identidade, você precisa passar a corrente adiante copiando seu link!</p>
        <Button onClick={handlePaywall} icon={copied ? Unlock : Copy} variant={copied ? 'success' : 'primary'}>
          {copied ? 'Desbloqueando...' : 'Copiar Link e Revelar'}
        </Button>
      </div>
    </div>
  );
};

const RevealScreen = ({ message, onBack }) => {
  const [isHolding, setIsHolding] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-black p-8 animate-in zoom-in duration-300 text-center justify-center space-y-12">
      <header className="absolute top-8 left-8"><button onClick={onBack} className="p-3 bg-slate-900 rounded-full text-slate-400"><ChevronLeft size={24} /></button></header>
      <div className="bg-slate-900 rounded-[3.5rem] p-10 relative shadow-2xl border border-slate-800 min-h-[400px] flex flex-col justify-center select-none touch-none">
        {isHolding ? (
          <div className="animate-in fade-in zoom-in duration-200 space-y-6">
            <div className="w-32 h-32 rounded-full mx-auto border-4 border-cyan-500 overflow-hidden shadow-2xl shadow-cyan-500/20">
              <img src={message.senderPhoto || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
            </div>
            <p className="text-3xl font-black italic tracking-tighter text-white">{message.senderName}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ShieldCheck size={72} className="mx-auto text-cyan-500 animate-pulse" />
            <p className="font-black text-lg text-white uppercase tracking-tight">Segure o botão abaixo para revelar</p>
          </div>
        )}
      </div>
      <button 
        onMouseDown={() => setIsHolding(true)} onMouseUp={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)} onTouchEnd={() => setIsHolding(false)}
        className={`w-full py-8 rounded-full font-black text-xl transition-all select-none touch-none ${isHolding ? 'bg-cyan-700 scale-95 shadow-inner' : 'bg-cyan-500 text-white shadow-2xl shadow-cyan-500/30'}`}
      >
        {isHolding ? 'OCULTANDO...' : '👆 PRESSIONE E SEGURE'}
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); } finally { setLoadingAuth(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
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

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-white" size={32} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OFFin Network...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {screen === 1 && <CreateLinkScreen user={user} onNext={setScreen} />}
        {screen === 2 && <LinkReadyScreen user={user} onNext={setScreen} />}
        {screen === 3 && targetUid && <SendSecretScreen targetUid={targetUid} user={user} onReset={() => setScreen(1)} />}
        {screen === 4 && <InboxScreen user={user} onBack={() => setScreen(1)} onSelectMessage={msg => { setSelectedMessage(msg); setScreen(5); }} />}
        {screen === 5 && selectedMessage && <ViralPaywallScreen user={user} message={selectedMessage} onBack={() => setScreen(4)} onUnlock={() => setScreen(6)} />}
        {screen === 6 && selectedMessage && <RevealScreen message={selectedMessage} onBack={() => setScreen(4)} />}
      </div>
    </div>
  );
}
