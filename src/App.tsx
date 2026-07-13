import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

const HOME_PATHS = new Set(["/", "/index.html"]);

const App = () => (HOME_PATHS.has(window.location.pathname) ? <Index /> : <NotFound />);

export default App;
