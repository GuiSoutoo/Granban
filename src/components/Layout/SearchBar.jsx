export default function SearchBar(){
    return(
    <form className="navbar-search">
        <input 
            type="search" 
            className="search-input" 
            placeholder="Procurar..." 
            aria-label="Procurar"
        />
    </form>
    )
}