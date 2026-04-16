import { Search, Bell, User } from "lucide-react";

const Header = () => {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-heading font-bold text-sm">H</span>
        </div>
        <span className="font-heading font-bold text-foreground tracking-wide">HEALTHO</span>
      </div>

      <nav className="hidden md:flex items-center gap-1">
        {["Overview", "Doctors", "Appointment", "Schedule", "Test Results"].map(
          (item, i) => (
            <button
              key={item}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {item}
            </button>
          )
        )}
      </nav>

      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Search size={18} />
        </button>
        <button className="relative w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-critical rounded-full" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User size={18} className="text-primary" />
        </div>
      </div>
    </header>
  );
};

export default Header;
