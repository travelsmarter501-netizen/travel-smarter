import Logo from "../Logo";

/**
 * Homepage logo intro: the Travel Smarter mark appears in the centre for a moment, rushes towards the viewer and vanishes, revealing the page
 * (about 650 ms, silent). Once per browser session, on the homepage only, never with prefers-reduced-motion.
 *
 * How it stays out of the way:
 * - The tiny inline script runs while the HTML is parsed, BEFORE the overlay is painted: it decides whether to play (home path, not played in
 *   this session, motion allowed) and marks <html data-home-intro>. Without that mark the overlay is `display: none`, so a visitor who already
 *   saw it, a reduced-motion visitor, a client-side navigation back to "/" or a blocked script never sees it.
 * - Pure CSS animation (globals.css, `.home-logo-intro`); the page under it renders and loads in parallel; `pointer-events: none`, so clicks
 *   always reach the page; the script removes the mark after 900 ms even if the animation never ran (e.g. the logo failed to load).
 */
const INTRO_SCRIPT = `(function(){try{if(location.pathname!=="/")return;if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("ts-home-intro"))return;sessionStorage.setItem("ts-home-intro","1");var d=document.documentElement;d.setAttribute("data-home-intro","");setTimeout(function(){d.removeAttribute("data-home-intro")},900)}catch(e){}})();`;

export default function HomeLogoIntro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <div aria-hidden="true" className="home-logo-intro pointer-events-none fixed inset-0 z-[100] items-center justify-center bg-white">
        <span className="home-logo-intro-mark inline-flex">
          <Logo size="lg" />
        </span>
      </div>
    </>
  );
}
