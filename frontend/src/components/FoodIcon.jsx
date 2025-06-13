import { LeafIcon, SaladIcon, BeefIcon, ThermometerIcon } from 'lucide-react'
import React from "react"

const FoodIcon = ({type}) => {
    if (type === "vegan") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-900">
                <LeafIcon size={12} className="mr-1" />
                Vegan
            </span>
        )
    }
    else if (type === "vegetarian") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <SaladIcon size={12} className="mr-1" />
                Vegetarian
            </span>
        )
    }
    else if (type === "protein") {
        return(<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <BeefIcon size={12} className="mr-1" />
            Protein
        </span>)
    }
    // 
    else if (type === "climate friendly") {
        return(<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        <ThermometerIcon size={12} className="mr-1" />
        Climate Friendly
    </span>)
    }
    else {
        return null;
    }
}




export default FoodIcon;