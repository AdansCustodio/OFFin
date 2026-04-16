import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  fetchSignInMethodsForEmail
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
  Image as ImageIcon,
  User,
  Eye
} from 'lucide-react';

/**
 * PROJETO OFFIN - VERSÃO DE PRODUÇÃO V7 (PT-BR TOTAL)
 * Foco: Localização para Português do Brasil, Ajuste de Story e Persistência.
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

// --- GERADOR DE IMAGEM PARA STORIES (CANVAS PT-BR) ---
const downloadStoryImage = (handle) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // 1. Fundo Gradiente Escuro
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Divulgação do Site no Cabeçalho
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('https://off-in.vercel.app/', 540, 100);

  // 3. Efeito de Grid (Linhas sutis)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for(let i=0; i<1080; i+=120) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1920); ctx.stroke(); }
  for(let i=0; i<1920; i+=120) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke(); }

  // 4. Logo OFF
  ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 900 240px sans-serif';
  ctx.fillText('OFF', 540, 480);
  
  // Logo IN
  ctx.shadowColor = 'rgba(236, 72, 153, 0.6)';
  ctx.fillStyle = '#ec4899';
  ctx.font = 'italic 900 180px sans-serif';
  ctx.fillText('IN', 540, 660);
  ctx.shadowBlur = 0;

  // 5. Caixa de Mensagem
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  if (ctx.roundRect) {
    ctx.roundRect(120, 850, 840, 360, 80);
  } else {
    ctx.rect(120, 850, 840, 360);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Texto na Caixa (PT-BR)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 70px sans-serif';
  ctx.fillText('ME MANDEM SEGREDOS', 540, 1010);
  ctx.font = '400 55px sans-serif';
  ctx.fillText('ANÔNIMOS 👀', 540, 1110);

  // 6. Área do Adesivo (Link)
  ctx.fillStyle = '#06b6d4';
  ctx.font = '900 80px sans-serif';
  ctx.fillText('LINK', 540, 1480);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('👇 COLE AQUI 👇', 540, 1550);

  // 7. Rodapé com Frase Instigante
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'italic bold 38px sans-serif';
  ctx.fillText('Até que ponto a curiosidade pode chegar?', 540, 1780);
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('Descubra também?', 540, 1840);

  // 8. Download
  const link = document.createElement('a');
  link.download = `offin-desafio-${handle.replace('@','')}.png`;
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
          {type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="text-xs font-bold leading-tight flex-1">{message}</p>
          <button onClick={onClose} className="opacity-50"><XCircle size={16} /></button>
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
      VOCÊ ESTÁ NO INSTAGRAM. CLIQUE EM "..." E "ABRIR NO NAVEGADOR" PARA O LOGIN FUNCIONAR.
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
    } catch (err) { setToast("Erro ao salvar perfil."); } finally { setLoading(false); }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#18181b] overflow-y-auto">
      <BrowserWarning />
      <div className="absolute top-[-15%] left-[-20%] w-[70%] h-[70%] bg-pink-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen p-8 animate-in fade-in duration-500">
        <header className="pt-6 pb-2 flex justify-center h-48 items-center">
           <div className="text-6xl font-black text-white italic tracking-tighter shadow-cyan-500">OFF<span className="text-cyan-500">IN</span></div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-tight italic">Descubra o que <br /> pensam de você 👀</h2>
            <p className="text-lg text-slate-400 font-medium px-4 leading-relaxed">Crie seu link, coloque no Story e prepare-se para os segredos.</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <input 
              type="text" 
              placeholder="@seu_instagram" 
              value={handle} 
              onChange={(e) => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value.replace('@',''))}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-5 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" 
            />
            <Button onClick={handleCreateProfile} loading={loading} disabled={!handle || handle === '@' || !user}>Gerar Meu Link</Button>
            <Button onClick={() => onNext(4)} variant="ghost">Entrar no Meu Radar</Button>
          </div>
        </main>
      </div>
    </div>
  );
};

const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  const [handle, setHandle] = useState('');
  const shareLink = `${APP_URL}?u=${user?.uid}`;

  useEffect(() => {
    if (user?.uid) {
      getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid)).then(d => {
        if (d.exists()) setHandle(d.data().handle);
      });
    }
  }, [user]);

  const handleCopy = () => {
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 1500); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] p-8 animate-in slide-in-from-right overflow-y-auto text-center justify-center">
      <h2 className="text-3xl font-black text-white mb-2 italic">TUDO PRONTO! 🚀</h2>
      <p className="text-slate-400 mb-10">Siga os passos abaixo para viralizar seu link.</p>
      
      <div className="space-y-6 w-full max-w-sm mx-auto">
        <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center text-pink-500 font-black text-xs uppercase"><ImageIcon size={14}/> Passo 1</div>
            <Button onClick={() => downloadStoryImage(handle)} variant="secondary" icon={Download}>Baixar Imagem para o Story</Button>
          </div>
          <div className="h-px bg-slate-800 w-full" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center text-cyan-500 font-black text-xs uppercase"><Share2 size={14}/> Passo 2</div>
            <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'}>
              {copied ? 'Link Copiado!' : 'Copiar Link Sticker'}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 italic px-4 leading-relaxed font-bold">Dica: No Instagram, use o adesivo de LINK e cole o link por cima da palavra "LINK" na imagem.</p>
      </div>
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
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), {
        id: msgId, targetUid, senderUid: currentUser.uid,
        senderName: currentUser.displayName || 'Anônimo',
        senderPhoto: currentUser.photoURL || '',
        text: message.trim(), createdAt: new Date().toISOString(), 
        isRevealed: false, status: 'sent'
      });
      setSent(true);
      setLoading(false);
    };

    if (user.isAnonymous) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await linkWithPopup(user, provider);
        await performSend(result.user);
      } catch (error) {
        if (error.code === 'auth/credential-already-in-use') {
          const result = await signInWithPopup(auth, new GoogleAuthProvider());
          await performSend(result.user);
        } else {
          setLoading(false);
          setToast("Erro no login. Tente novamente ou abra no navegador externo.");
        }
      }
    } else { await performSend(user); }
  };

  if (sent) return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8 text-center animate-in zoom-in">
      <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
      <h2 className="text-3xl font-black italic mb-4 text-slate-900">Segredo Enviado! 🤫</h2>
      <p className="text-slate-500 mb-8">@{targetHandle} só saberá quem é você se desbloquear a corrente.</p>
      <Button onClick={onReset}>Criar Meu Link Também</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 p-8 overflow-y-auto">
      <BrowserWarning />
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <h2 className="text-3xl font-black text-white italic leading-tight">Mandar segredo para @{targetHandle}</h2>
        <div className="w-full max-w-xs space-y-4">
          <textarea 
            placeholder="Escreva algo que ninguém saiba..." 
            value={message} onChange={(e) => setMessage(e.target.value)} 
            maxLength={150} 
            className="w-full h-40 bg-slate-800 border border-slate-700 rounded-[2rem] p-6 text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium" 
          />
          <Button onClick={handleSend} loading={loading} disabled={!message.trim()}>
            {user?.isAnonymous ? 'Sincronizar e Enviar' : 'Enviar Segredo'}
          </Button>
        </div>
      </div>
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
    return onSnapshot(msgRef, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, [user]);

  const receivedMsgs = messages.filter(m => m.targetUid === user.uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sentMsgs = messages.filter(m => m.senderUid === user.uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleLink = async () => {
    setLinking(true);
    try {
      await linkWithPopup(user, new GoogleAuthProvider());
      setToast("Conta sincronizada!", "success");
    } catch (e) {
      if (e.code === 'auth/credential-already-in-use') {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } else { setToast("Falha ao salvar conta. Tente abrir no Chrome."); }
    } finally { setLinking(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="text-slate-400"><ChevronLeft /></button>
        <div className="text-center">
           <h1 className="font-black text-slate-800 text-lg italic uppercase tracking-tighter">OFF<span className="text-cyan-500">IN</span> RADAR</h1>
           {!user?.isAnonymous && <span className="text-[10px] text-slate-400 font-bold block">{user.displayName}</span>}
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 overflow-hidden shadow-sm">
           <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="User" />
        </div>
      </header>

      <div className="flex p-1 mx-6 mt-4 rounded-2xl bg-slate-200/50 border border-slate-200">
        <button onClick={() => setActiveTab('received')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'received' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400'}`}>
          <Inbox size={14} /> RECEBIDOS ({receivedMsgs.length})
        </button>
        <button onClick={() => setActiveTab('sent')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'sent' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400'}`}>
          <Send size={14} /> ENVIADOS ({sentMsgs.length})
        </button>
      </div>

      <main className="flex-1 p-6 space-y-4 pb-12">
        {user?.isAnonymous && (
          <div className="bg-cyan-50 border border-cyan-100 p-5 rounded-[2rem] flex items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-cyan-900 leading-tight">Salve seus dados para não perder o acesso ao Radar.</p>
            <button onClick={handleLink} disabled={linking} className="bg-cyan-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-cyan-500/20">{linking ? '...' : 'Salvar'}</button>
          </div>
        )}

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div> : 
          (activeTab === 'received' ? receivedMsgs : sentMsgs).length === 0 ? <p className="text-center text-slate-300 mt-20 font-black uppercase text-[10px] tracking-widest">Vazio por enquanto...</p> :
          (activeTab === 'received' ? receivedMsgs : sentMsgs).map(msg => (
            <div key={msg.id} onClick={() => activeTab === 'received' && onSelectMessage(msg)} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all ${activeTab === 'received' ? 'cursor-pointer active:scale-95' : 'opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${msg.isRevealed ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                   {msg.isRevealed ? 'Revelado' : 'Trancado'}
                </span>
                {activeTab === 'sent' && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
                    {msg.status === 'sent' ? <Clock size={10} /> : <Eye size={10} />}
                    {msg.status === 'sent' ? 'Enviado' : msg.status === 'viewed' ? 'Visto' : 'Revelado'}
                  </div>
                )}
              </div>
              <p className="italic text-slate-700 font-serif text-lg leading-relaxed">"{msg.text}"</p>
              {activeTab === 'received' && !msg.isRevealed && <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-cyan-500 uppercase">Revelar Identidade <ArrowRight size={12}/></div>}
            </div>
          ))
        }
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
    <div className="flex flex-col min-h-screen bg-slate-900 text-white p-8 text-center justify-center space-y-12">
      <Lock size={64} className="text-pink-500 mx-auto animate-pulse" />
      <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">Quem mandou isso?</h2>
      <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl">
        <p className="italic text-xl font-serif text-slate-200 leading-relaxed">"{message.text}"</p>
      </div>
      <div className="bg-cyan-900/30 border border-cyan-500/50 p-8 rounded-[2.5rem] space-y-6">
        <p className="text-sm font-bold italic leading-relaxed text-cyan-100">Para ver a identidade, você precisa passar a corrente adiante copiando seu link!</p>
        <Button onClick={handlePaywall} icon={copied ? Unlock : Copy} variant={copied ? 'success' : 'primary'}>
           {copied ? 'Revelando...' : 'Copiar Link e Revelar'}
        </Button>
      </div>
    </div>
  );
};

const RevealScreen = ({ message, onBack }) => {
  const [isHolding, setIsHolding] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-black p-8 text-center justify-center space-y-12 overflow-y-auto">
      <header className="absolute top-8 left-8"><button onClick={onBack} className="p-3 bg-slate-900 rounded-full text-slate-400"><ChevronLeft size={24} /></button></header>
      <div className="bg-slate-900 rounded-[4rem] p-10 relative shadow-2xl min-h-[450px] flex flex-col justify-center select-none touch-none border border-slate-800">
        {isHolding ? (
          <div className="animate-in fade-in zoom-in duration-300 space-y-6">
            <div className="w-40 h-40 rounded-full mx-auto border-4 border-cyan-500 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <img src={message.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderUid}`} className="w-full h-full object-cover" />
            </div>
            <p className="text-4xl font-black italic text-white leading-tight tracking-tighter">{message.senderName}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ShieldCheck size={84} className="mx-auto text-cyan-500 animate-pulse" />
            <p className="font-black text-xl text-white uppercase tracking-tight italic">Segure para Revelar</p>
          </div>
        )}
      </div>
      <button 
        onMouseDown={() => setIsHolding(true)} onMouseUp={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)} onTouchEnd={() => setIsHolding(false)}
        className={`w-full py-8 rounded-full font-black text-2xl transition-all select-none touch-none ${isHolding ? 'bg-cyan-700 scale-95 shadow-inner' : 'bg-cyan-500 text-white shadow-[0_0_40px_rgba(6,182,212,0.4)]'}`}
      >
        {isHolding ? 'MOSTRANDO...' : '👆 PRESSIONE E SEGURE'}
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
