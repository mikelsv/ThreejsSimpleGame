// MSV Core Library functions for JavaScript. 2025.

// Vector2
class KiVec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Method for calculating the length of a vector
    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    // Method for vector normalization
    normalize() {
        const len = this.length();
        if (len === 0) return new KiVec2(0, 0); // Возвращаем нулевой вектор, если длина равна 0
        return new KiVec2(this.x / len, this.y / len);
    }

    // Method for adding two vectors
    add(vector) {
        return new KiVec2(this.x + vector.x, this.y + vector.y);
    }

    // Method for subtracting two vectors
    subtract(vector) {
        return new KiVec2(this.x - vector.x, this.y - vector.y);
    }

    // Method for multiplying a vector by a scalar
    multiply(scalar) {
        return new KiVec2(this.x * scalar, this.y * scalar);
    }

    // Method of truncating values ​​to specified boundaries
    crop(min, max){
        this.x = Math.max(min, Math.min(max, this.x));
        this.y = Math.max(min, Math.min(max, this.y));
    }

    // Method to reset values ​​to zero
    reset(){
        this.x = 0;
        this.y = 0;
    }

    // Method to display a vector as a string
    toString() {
        return `KiVec2(${this.x}, ${this.y})`;
    }
}