export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 text-center text-xs text-gray-500">
        A free resource from{" "}
        <a
          href="https://bridgesstrategy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4f8f9b] hover:text-[#3d7a85] font-medium"
        >
          Bridges Strategy
        </a>
        {" "}&middot;{" "}
        <a
          href="https://bridgesstrategy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4f8f9b] hover:text-[#3d7a85]"
        >
          bridgesstrategy.com
        </a>
        {" "}&middot;{" "}
        Questions or feedback:{" "}
        <a
          href="mailto:mark@bridgesstrategy.com"
          className="text-[#4f8f9b] hover:text-[#3d7a85]"
        >
          mark@bridgesstrategy.com
        </a>
      </div>
    </footer>
  );
}
