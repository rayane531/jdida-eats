exports.handler = async function () {

    const query = `
        [out:json][timeout:30];

        (
            nwr["amenity"="restaurant"](33.18,-8.55,33.29,-8.42);
            nwr["amenity"="cafe"](33.18,-8.55,33.29,-8.42);
            nwr["amenity"="fast_food"](33.18,-8.55,33.29,-8.42);
            nwr["amenity"="food_court"](33.18,-8.55,33.29,-8.42);
        );

        out center tags;
    `;

    try {

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    "data=" +
                    encodeURIComponent(query)
            }
        );

        if (!response.ok) {

            return {
                statusCode: response.status,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    error:
                        `Overpass HTTP ${response.status}`
                })
            };
        }

        const data =
            await response.json();

        return {

            statusCode: 200,

            headers: {

                "Content-Type":
                    "application/json",

                "Access-Control-Allow-Origin":
                    "*"

            },

            body:
                JSON.stringify(data)
        };

    } catch (error) {

        console.error(
            "Overpass proxy error:",
            error
        );

        return {

            statusCode: 500,

            headers: {

                "Content-Type":
                    "application/json",

                "Access-Control-Allow-Origin":
                    "*"

            },

            body: JSON.stringify({

                error:
                    "Unable to load restaurants",

                message:
                    error.message

            })
        };
    }
};
