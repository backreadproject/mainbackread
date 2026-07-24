// Runs before first paint, ahead of React hydration, so a dark mode user never
// sees a white flash. It must stay a plain inline script for that reason: a
// client component would run after the page has already painted light.
export default function ThemeScript() {
  const js = `(function(){try{if(localStorage.getItem('rp-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}