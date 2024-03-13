import { ProcessorForm } from "@/components/form/ProcessorForm";
import "./App.css";
import { ThemeProvider } from "./components/ui/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-w-[100%] bg-background">
        <ProcessorForm />
      </div>
    </ThemeProvider>
  );
}

export default App;
