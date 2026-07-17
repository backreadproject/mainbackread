const INK="#0A0E17",CANVAS="#FBFBFA",CARD="#FFFFFF",BLUE="#1D4ED8",SLATE="#475569",BLUE_SOFT="#EAF0FF";
const INTER="var(--font-geist-sans), system-ui, sans-serif";
export default function CheckEmailPage(){
  return (<div style={{minHeight:"100vh",background:CANVAS,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:INTER,color:INK,padding:40}}>
    <div style={{width:380,background:CARD,borderRadius:16,padding:36,boxShadow:"0 1px 3px rgba(11,18,32,0.04), 0 12px 40px rgba(11,18,32,0.08)",textAlign:"center"}}>
      <div style={{width:52,height:52,borderRadius:14,background:BLUE_SOFT,color:BLUE,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z M4 7l8 6 8-6"/></svg>
      </div>
      <h1 style={{fontSize:23,fontWeight:500,letterSpacing:"-0.015em",margin:"0 0 8px"}}>Check your inbox</h1>
      <p style={{fontSize:14,color:SLATE,lineHeight:1.55,margin:"0 0 22px"}}>We've sent you a link to confirm your account. Click it, and you'll be signed in and ready to send your first document.</p>
      <a href="/login" style={{fontSize:14,color:BLUE,textDecoration:"none",fontWeight:500}}>Back to sign in</a>
    </div>
  </div>);
}
