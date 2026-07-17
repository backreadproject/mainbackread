import Link from "next/link";
const INK="#0A0E17",CANVAS="#FBFBFA",BLUE="#1D4ED8",SLATE="#475569";
const INTER="var(--font-dm-sans), system-ui, sans-serif";
export default function NotFound(){
  return (<div style={{minHeight:"100vh",background:CANVAS,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:INTER,color:INK,padding:40,textAlign:"center"}}>
    <div style={{fontSize:14,fontWeight:500,color:BLUE,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>404</div>
    <h1 style={{fontSize:32,fontWeight:500,letterSpacing:"-0.02em",margin:"0 0 10px"}}>This page went dark.</h1>
    <p style={{fontSize:16,color:SLATE,margin:"0 0 24px",maxWidth:400,lineHeight:1.5}}>The link may be broken, or the page may have moved.</p>
    <Link href="/documents" style={{background:BLUE,color:"#fff",fontSize:15,fontWeight:500,padding:"11px 20px",borderRadius:10,textDecoration:"none",boxShadow:"0 4px 12px rgba(45,107,255,0.25)"}}>Back to your documents</Link>
  </div>);
}
