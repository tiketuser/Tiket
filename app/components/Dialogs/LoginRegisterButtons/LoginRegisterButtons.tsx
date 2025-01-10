const LoginRegisterButtons = () => {
    return (
        <>
            <div className="relative flex justify-center items-center">
                <button className="absolute translate-x-1/4 px-20 py-2 bg-gray-200 text-black rounded-full text-sm rtl">
                    התחבר
                </button>
                <button className="absolute -translate-x-1/2 px-20 py-2 bg-primary text-white rounded-full text-sm rtl">
                    הירשם
                </button>
            </div> 
        </>
    );
  };
  
  export default LoginRegisterButtons;