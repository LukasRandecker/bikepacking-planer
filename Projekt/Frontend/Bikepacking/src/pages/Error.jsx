function ErrorPage() {
  return (
    <div className="bg-cover bg-center bg-no-repeat border-t-1 border-zinc-600">
      
     
      {/* Zentrale Error Message */}
      <div className="h-[65vh] flex items-center justify-center px-6">
        <div className="text-center ">
          <h1 className="text-7xl md:text-8xl font-extrabold text-zinc-800 mb-6">
            Error 404 
          </h1>

          <p className="text-xl md:text-2xl text-zinc-600 mb-2">
            This route leads nowhere… for now.
          </p>

          <p className="text-sm md:text-base text-zinc-600">
            The page might not exist or the feature hasn’t been implemented yet.
          </p>

           <div className="p-10">
              <a 
                href="/" 
                 className="px-6 py-3 text-lg bg-black text-white rounded-lg uppercase hover:bg-white hover:text-black border-1 border-black transition"
              >
               Back
              </a>
            </div>
        </div>
       
      </div>
    </div>
  )
}

export default ErrorPage
