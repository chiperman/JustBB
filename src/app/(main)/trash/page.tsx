import { isAuthenticated } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { TrashClient } from "@/features/trash";

export default async function TrashPage() {
    if (!(await isAuthenticated())) {
        redirect("/");
    }

    return <TrashClient />;
}
