import { useEffect } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

export type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
};

function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? AiOutlineCheckCircle : AiOutlineCloseCircle;

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${bgColor} animate-in fade-in slide-in-from-right-4 duration-300`}
    >
      <Icon className="text-xl" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default Toast;
