import {Mail} from "lucide-react"

function Footer() {
  return (
    <footer className="relative w-full">

      <div className="relative w-full h-[500px] md:h-[380px]">
        <img src={"../../../IMG/HeroIMG2.jpg"} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/70" />

        <div className="absolute inset-0 pt-6 flex items-top md:items-center">
          <div className="max-w-7xl mx-auto px-6 md:px-20 w-full text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <h3 className="text-2xl font-bold py-2 uppercase">Tour. Setup. Packlist. </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Plan your ride. <br /> Dial in your setup.<br /> Never forget a thing.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold py-2 uppercase">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>
                    <a href="/impressum" className="hover:text-white transition">
                      Impressum
                    </a>
                  </li>
                  <li>
                    <a href="/datenschutz" className="hover:text-white transition">
                      Datenschutz
                    </a>
                  </li>
                  <li>
                    <a href="/agb" className="hover:text-white transition">
                      AGB
                    </a>
                  </li>
                </ul>
              </div>
              <div className="w-full">
                <h4 className="text-lg font-semibold py-2 uppercase">Contact</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li> <a href="mailto:contact@example.com" className="flex items-center gap-2 hover:text-white transition"><Mail />contact@example.com</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
