import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ storageId: string }> }
) {
    const { storageId } = await params;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    if (!convexUrl) {
        return new NextResponse("Convex not configured", { status: 500 });
    }
    
    try {
        // Query Convex to get the storage URL
        const response = await fetch(`${convexUrl}/api/storage/getUrl`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                storageId,
            }),
        });
        
        if (!response.ok) {
            return new NextResponse("File not found", { status: 404 });
        }
        
        const { url } = await response.json();
        
        if (!url) {
            return new NextResponse("File not found", { status: 404 });
        }
        
        // Fetch the actual file from the storage URL
        const fileResponse = await fetch(url);
        
        if (!fileResponse.ok) {
            return new NextResponse("Failed to fetch file", { status: fileResponse.status });
        }
        
        const arrayBuffer = await fileResponse.arrayBuffer();
        const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
        
        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
