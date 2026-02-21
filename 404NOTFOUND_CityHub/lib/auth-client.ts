import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";


export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",

    plugins: [convexClient(),
        inferAdditionalFields({
            user: {
                role: {
                    type: "string",
                    required: false,
                    defaultValue: "user",
                }
            }
        })
    ],
});