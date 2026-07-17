"use client";
const INK="#0B1220",CANVAS="#F4F6FA",BLUE="#2D6BFF",SLATE="#64748B";
const INTER="'Moderat', 'Inter', sans-serif";
export default function Error({ reset }: { error: Error; reset: () => void }){
  return (<div style={{minHeight:"100vh",background:CANVAS,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:INTER,color:INK,padding:40,textAlign:"center"}}>
    <h1 style={{fontSize:30,fontWeight:500,letterSpacing:"-0.02em",margin:"0 0 10px"}}>Something went wrong.</h1>
    <p style={{fontSize:16,color:SLATE,margin:"0 0 24px",maxWidth:420,lineHeight:1.5}}>An unexpected error occurred. Try again, and if it keeps happening, refresh the page.</p>
    <button onClick={reset} style={{background:BLUE,color:"#fff",fontSize:15,fontWeight:500,padding:"11px 20px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:INTER,boxShadow:"0 4px 12px rgba(45,107,255,0.25)"}}>Try again</button>
  </div>);
}
