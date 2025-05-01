export type Err = {
    /**
     * The error message.
     */
    message: string
    
    /**
     * The error code.
     */
    code?: string,
    data?: any
}


/**
 * Create a new error.
 */
export const create = (message: string, code?: string, data?: any): Err => ({
    message,
    code,
    data
})

/**
 * Throws an error with the given message and code.
 * 
 * Returns the type such that the function can be used in a type-safe way.
 */
export const fail = <T = never>(message: string, code?: string, data?: any): T => {
    throw create(message, code, data)
}

const Err = {
    create,
    fail,
}

export default Err