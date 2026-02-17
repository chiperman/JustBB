import { isAdmin } from "@/actions/auth";
import { redirect } from "next/navigation";
import TrashClient from "./TrashClient";

export default async function TrashPage() {
    if (!(await isAdmin())) {
        redirect("/");
    }

    return <TrashClient />;
}
