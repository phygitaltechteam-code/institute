/**
 * Compact application footer. Layouts place it after the page content inside a
 * flex column, so it sits at the bottom of the screen on short pages and after
 * the content on long ones.
 */
const Footer = () => {
  return (
    <footer className="border-t border-stroke bg-pure-white px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-1 text-[11px] text-slate-500 sm:flex-row sm:text-xs">
        <p>
          &copy; {new Date().getFullYear()}{' '}
          <span className="font-semibold text-primary-navy">MedCode Ninja</span>. All rights reserved.
        </p>
        <p className="hidden sm:block">Learn · Practice · Get placed</p>
      </div>
    </footer>
  );
};

export default Footer;
