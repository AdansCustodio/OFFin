import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  runTransaction
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
  Eye,
  Coins,
  Ticket,
  Store,
  CalendarHeart,
  CreditCard,
  Trash2,
  Bell,
  QrCode
} from 'lucide-react';

/**
 * PROJETO OFFIN - VERSÃO DE PRODUÇÃO V18 (BUG FIXES)
 * Correção: Caminho do Firebase (appId com slash) e Erro de renderização do Toast.
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

// Sanitização crucial do appId para evitar erro de segmentos ímpares no Firestore
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : "offinn-89849";
const appId = rawAppId.replace(/\//g, '_'); 

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

// --- COMPONENTE TOAST (CORRIGIDO) ---
const Toast = ({ message, type = 'error', onClose }) => {
  if (!message) return null;
  // Garantir que message seja renderizável (string)
  const displayMessage = typeof message === 'string' ? message : "Erro desconhecido";
  
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300 w-[90%] max-w-xs">
      <div className={`px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex flex-col gap-2 border ${
        type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' : 'bg-emerald-500/90 border-emerald-400/50 text-white'
      }`}>
        <div className="flex items-center gap-3">
          {type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="text-xs font-bold flex-1">{displayMessage}</p>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity"><XCircle size={16} /></button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE BOTÃO ---
const Button = ({ children, onClick, variant = 'primary', icon: Icon, disabled, loading, className = '' }) => {
  const base = 'w-full py-4 px-6 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100';
  const variants = {
    primary: 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 border border-cyan-400/50',
    secondary: 'bg-[#09090b] text-slate-300 border border-white/10 hover:bg-white/5',
    ghost: 'bg-transparent text-slate-400 font-medium text-sm hover:text-white',
    success: 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 border border-emerald-400/50',
    warning: 'bg-yellow-500 text-yellow-950 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 border border-yellow-400/50',
    danger: 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.3)] hover:bg-pink-500 border border-pink-400/50',
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

// --- MODAL DA LOJA ---
const StoreModal = ({ isOpen, onClose, user, userProfile, showToast }) => {
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null); 
  const [initialTokens, setInitialTokens] = useState(0); 
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (paymentData && userProfile?.tokens > initialTokens) {
      showToast("Pagamento Confirmado! Moedas adicionadas.", "success");
      setPaymentData(null); 
    }
  }, [userProfile?.tokens, paymentData, initialTokens, showToast]);
  
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastClaimedStr = userProfile?.lastDailyCoinDate;
  const canClaimDaily = lastClaimedStr !== todayStr;

  const handleClaimDaily = async () => {
    if (!canClaimDaily || !user) return;
    setLoadingDaily(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "Usuário não encontrado";
        const currentData = userDoc.data();
        if (currentData.lastDailyCoinDate === todayStr) throw "Já resgatado";
        transaction.update(userRef, {
          tokens: (currentData.tokens || 0) + 1,
          lastDailyCoinDate: todayStr
        });
      });
      showToast("1 Moeda resgatada!", "success");
    } catch (err) { showToast("Erro no resgate."); } finally { setLoadingDaily(false); }
  };

  const handleRealPurchase = async (amount, packageId) => {
    if (!user) return;
    setIsProcessingPayment(true);
    setInitialTokens(userProfile?.tokens || 0);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: user.uid, packageId })
      });
      const data = await response.json();
      if (data.success && data.qr_code) {
        setPaymentData(data);
        setCopiedPix(false);
      } else {
        showToast("Erro ao gerar PIX. Tente novamente.");
      }
    } catch (err) {
      showToast("Erro de comunicação com o servidor.");
    } finally { setIsProcessingPayment(false); }
  };

  const copyPixCode = () => {
    copyToClipboardFallback(paymentData.qr_code);
    setCopiedPix(true);
    showToast("Código PIX Copiado!", "success");
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => !paymentData && onClose()}></div>
      <div className="relative w-full max-w-sm bg-[#18181b] border border-white/10 rounded-[2.5rem] p-7 space-y-7 animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-yellow-500"><Store size={24} /></div>
            <div>
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Carteira</h3>
              <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Saldo: {userProfile?.tokens || 0} Moedas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"><XCircle size={24} /></button>
        </div>

        {paymentData ? (
          <div className="space-y-6 text-center animate-in slide-in-from-right-10">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-3xl p-6 space-y-4">
              <h4 className="text-xl font-black text-white italic uppercase">Pague via PIX</h4>
              <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-lg">
                <img src={`data:image/png;base64,${paymentData.qr_code_base64}`} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="flex gap-2">
                <input type="text" readOnly value={paymentData.qr_code} className="flex-1 bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 text-[10px] text-slate-400 focus:outline-none" />
                <Button onClick={copyPixCode} variant={copiedPix ? 'success' : 'primary'} className="!w-auto !px-4 !py-3">
                  {copiedPix ? <CheckCircle2 size={18}/> : <Copy size={18}/>}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
               <Loader2 size={20} className="animate-spin text-cyan-500" />
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Aguardando pagamento...</p>
            </div>
            <Button onClick={() => setPaymentData(null)} variant="ghost">Voltar</Button>
          </div>
        ) : (
          <div className="space-y-7">
            <div className="bg-gradient-to-br from-[#09090b] to-cyan-900/20 border border-cyan-500/20 p-5 rounded-3xl space-y-4">
              <h4 className="text-white font-black italic uppercase flex items-center gap-2"><CalendarHeart size={18} className="text-cyan-400" /> Bônus Diário</h4>
              <Button onClick={handleClaimDaily} loading={loadingDaily} disabled={!canClaimDaily} variant={canClaimDaily ? 'primary' : 'secondary'} icon={Coins}>
                {canClaimDaily ? 'Resgatar 1 Moeda' : 'Já resgatado'}
              </Button>
            </div>

            <div className="space-y-4 relative">
              {isProcessingPayment && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-yellow-500" /></div>}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleRealPurchase(0.99, 1)} className="bg-[#09090b] border border-white/5 p-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
                  <Coins size={22} className="text-yellow-600"/>
                  <span className="font-black text-white text-xs">1 Moeda</span>
                  <span className="text-[9px] text-slate-400">R$ 0,99</span>
                </button>
                <button onClick={() => handleRealPurchase(3.99, 5)} className="bg-[#09090b] border border-white/5 p-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
                  <Coins size={22} className="text-yellow-500"/>
                  <span className="font-black text-white text-xs">5 Moedas</span>
                  <span className="text-[9px] text-slate-400">R$ 3,99</span>
                </button>
                <button onClick={() => handleRealPurchase(5.99, 10)} className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
                  <Coins size={22} className="text-yellow-400"/>
                  <span className="font-black text-yellow-400 text-xs">10 Moedas</span>
                  <span className="text-[9px] text-yellow-500">R$ 5,99</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- TELAS DO APP (Restauradas) ---

const CreateLinkScreen = ({ user, onNext, showToast }) => {
  const [handle, setHandle] = useState('@');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!handle.trim() || handle === '@' || !user) return;
    setLoading(true);
    try {
      const cleanHandle = handle.trim().replace('@', '');
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userRef, { 
        uid: user.uid, 
        handle: cleanHandle, 
        createdAt: new Date().toISOString(),
        tokens: 1
      }, { merge: true });
      onNext(2); 
    } catch (err) { showToast("Erro ao salvar perfil."); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-10 animate-in fade-in duration-500">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter">Quem mandou esse segredo? 👀</h2>
      <div className="w-full max-w-xs space-y-4">
        <input 
          type="text" 
          placeholder="@seu_instagram" 
          value={handle} 
          onChange={(e) => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
          className="w-full bg-[#09090b] border border-white/10 rounded-xl py-4 px-6 text-white font-bold text-center focus:outline-none focus:border-cyan-500 transition-all" 
        />
        <Button onClick={handleCreateProfile} loading={loading}>Gerar Meu Link</Button>
        <Button onClick={() => onNext(4)} variant="ghost">Ver Meu Radar</Button>
      </div>
    </div>
  );
};

const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  const shareLink = `${APP_URL}?u=${user?.uid}`;

  const handleCopy = () => {
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 2000); 
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8 animate-in slide-in-from-right">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20"><CheckCircle2 size={32} /></div>
      <h2 className="text-3xl font-black italic uppercase">Link Gerado!</h2>
      <div className="bg-[#09090b] border border-white/5 p-6 rounded-2xl w-full max-w-sm space-y-6">
        <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'}>
          {copied ? 'Link Copiado!' : 'Copiar Link Sticker'}
        </Button>
      </div>
      <p className="text-slate-400 text-sm">Poste no Instagram e comece a receber segredos!</p>
    </div>
  );
};

const SendSecretScreen = ({ targetUid, user, onReset, showToast }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setLoading(true);
    try {
      const msgId = crypto.randomUUID();
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await setDoc(msgRef, {
        id: msgId, 
        targetUid, 
        senderUid: user.uid, 
        text: message.trim(), 
        createdAt: new Date().toISOString(), 
        isRevealed: false,
        status: 'sent'
      });
      setSent(true);
    } catch (err) { showToast("Erro ao enviar."); } finally { setLoading(false); }
  };

  if (sent) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
      <CheckCircle2 size={64} className="text-emerald-500" />
      <h2 className="text-3xl font-black italic uppercase">Segredo Enviado! 🤫</h2>
      <Button onClick={onReset}>Quero Criar Meu Link</Button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
      <h2 className="text-3xl font-black italic uppercase">Mandar segredo</h2>
      <textarea 
        placeholder="Escreva algo aqui..." 
        value={message} onChange={(e) => setMessage(e.target.value)} 
        className="w-full h-44 bg-[#09090b] border border-white/10 rounded-2xl p-6 text-white resize-none focus:outline-none focus:border-cyan-500 font-medium" 
      />
      <Button onClick={handleSend} loading={loading} disabled={!message.trim()} icon={Send}>Enviar Segredo</Button>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [screen, setScreen] = useState(1);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [targetUid, setTargetUid] = useState(null); 
  const [selectedMessage, setSelectedMessage] = useState(null); 
  const [toast, setToast] = useState(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  // Helper unificado para toasts
  const showToast = React.useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error(e); } finally { setLoadingAuth(false); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    return onSnapshot(userRef, (d) => {
      if(d.exists()) setUserProfile(d.data());
    }, (err) => console.error("Firestore Error:", err));
  }, [user]);

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
    <div className="min-h-screen bg-[#18181b] flex items-center justify-center text-white italic font-black text-4xl animate-pulse">
      OFFIN
    </div>
  );

  return (
    <div className="min-h-screen bg-[#18181b] text-white flex justify-center font-sans relative overflow-hidden">
      <div className="w-full max-w-md bg-[#18181b] min-h-screen flex flex-col z-10 border-x border-white/5 relative">
        
        {screen === 1 && <CreateLinkScreen user={user} onNext={setScreen} showToast={showToast} />}
        {screen === 2 && <LinkReadyScreen user={user} onNext={setScreen} />}
        {screen === 3 && targetUid && <SendSecretScreen targetUid={targetUid} user={user} onReset={() => setScreen(1)} showToast={showToast} />}
        
        {screen === 4 && (
          <div className="p-6 h-full flex flex-col">
            <header className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black italic uppercase">Radar</h2>
              <button onClick={() => setIsStoreOpen(true)} className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-yellow-500/20">
                <Coins size={16}/> {userProfile?.tokens || 0}
              </button>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center opacity-40">
              <Inbox size={48} className="mb-4" />
              <p className="font-bold uppercase text-xs tracking-widest">A carregar segredos...</p>
            </main>
          </div>
        )}

        <StoreModal 
          isOpen={isStoreOpen} 
          onClose={() => setIsStoreOpen(false)} 
          user={user} 
          userProfile={userProfile} 
          showToast={showToast} 
        />
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
