const Alert_Popup = ({
  onClose,
  title = "Hinweis",
  message,
  buttonText = "OK",
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-79 md:w-99 rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">{title}</h2>
        <div className="text-center text-sm mb-5">{message}</div>
        <button
          onClick={onClose}
          className="w-full bg-black text-white py-2 rounded-lg uppercase"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default Alert_Popup;
