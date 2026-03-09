import { isAdmin } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { TrashClient } from "@/features/trash";

export default async function TrashPage() {
    if (!(await isAdmin())) {
        redirect("/");
    }

    return <TrashClient />;
}
