<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { authClient } from "$lib/auth-client";
    import { cn } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Loader2 } from "lucide-svelte";

    // 从服务端获取验证模式
    let { data } = $props();
    const isOtpMode = $derived(data.emailVerificationMode === "otp");

    let loading = $state(false);
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let otp = $state("");
    let otpSent = $state(false);
    let emailChecked = $state(false); // 邮箱是否已检查
    const returnTo = $derived($page.url.searchParams.get("returnTo"));

    // 从邮箱提取默认姓名
    function getNameFromEmail(email: string): string {
        const localPart = email.split("@")[0];
        // 首字母大写
        return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }

    async function handleGoogleSignUp() {
        loading = true;
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: returnTo || "/dashboard",
            });
        } catch (error) {
            loading = false;
            console.error("Authentication error:", error);
            toast.error("注册失败，请重试");
        }
    }

    // 验证表单
    function validateForm(): boolean {
        if (!email || !password) {
            toast.error("请填写邮箱和密码");
            return false;
        }
        if (password !== confirmPassword) {
            toast.error("两次输入的密码不一致");
            return false;
        }
        if (password.length < 8) {
            toast.error("密码长度至少为 8 位");
            return false;
        }
        return true;
    }

    // OTP 模式：发送验证码（后端 before hook 会检查邮箱是否存在）
    async function handleSendOTP() {
        if (!email) {
            toast.error("请输入邮箱地址");
            return;
        }
        if (!validateForm()) return;

        loading = true;
        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification",
            });
            if (result.error) {
                // 检查是否是账号已存在的错误
                if (
                    result.error.message?.includes("已注册") ||
                    result.error.message?.includes("already") ||
                    result.error.message?.includes("exists") ||
                    result.error.code === "USER_ALREADY_EXISTS"
                ) {
                    toast.error("该邮箱已注册，请直接登录");
                } else {
                    toast.error(result.error.message || "发送验证码失败");
                }
            } else {
                otpSent = true;
                emailChecked = true;
                toast.success("验证码已发送到您的邮箱");
            }
        } catch (error) {
            console.error("Send OTP error:", error);
            toast.error("发送验证码失败");
        } finally {
            loading = false;
        }
    }

    // 普通模式：直接注册
    async function handleEmailSignUp(e: Event) {
        e.preventDefault();
        if (!validateForm()) return;

        loading = true;
        try {
            const result = await authClient.signUp.email({
                email,
                password,
                name: getNameFromEmail(email),
                callbackURL: returnTo || "/dashboard",
            });
            if (result.error) {
                if (
                    result.error.message?.includes("already") ||
                    result.error.message?.includes("exists")
                ) {
                    toast.error("该邮箱已注册，请直接登录");
                } else {
                    toast.error(result.error.message || "注册失败");
                }
                loading = false;
            } else {
                toast.success("注册成功！");
                goto(returnTo || "/dashboard");
            }
        } catch (error) {
            loading = false;
            console.error("Registration error:", error);
            toast.error("注册失败，请重试");
        }
    }

    // OTP 模式：验证并注册
    async function handleOTPSignUp(e: Event) {
        e.preventDefault();

        // 如果还没发送验证码，先发送
        if (!otpSent) {
            await handleSendOTP();
            return;
        }

        // 验证码已发送，验证并注册
        if (!otp || otp.length < 6) {
            toast.error("请输入 6 位验证码");
            return;
        }

        loading = true;
        try {
            // 先注册用户
            const signUpResult = await authClient.signUp.email({
                email,
                password,
                name: getNameFromEmail(email),
                callbackURL: returnTo || "/dashboard",
            });
            if (signUpResult.error) {
                if (
                    signUpResult.error.message?.includes("already") ||
                    signUpResult.error.message?.includes("exists")
                ) {
                    toast.error("该邮箱已注册，请直接登录");
                } else {
                    toast.error(signUpResult.error.message || "注册失败");
                }
                loading = false;
                return;
            }
            // 然后验证邮箱
            const verifyResult = await authClient.emailOtp.verifyEmail({
                email,
                otp,
            });
            if (verifyResult.error) {
                toast.error(verifyResult.error.message || "验证码错误");
                loading = false;
            } else {
                toast.success("注册成功！邮箱已验证");
                goto(returnTo || "/dashboard");
            }
        } catch (error) {
            loading = false;
            console.error("OTP Registration error:", error);
            toast.error("注册失败，请重试");
        }
    }

    // 重新发送验证码
    async function resendOTP() {
        loading = true;
        try {
            const result = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification",
            });
            if (result.error) {
                toast.error(result.error.message || "发送验证码失败");
            } else {
                toast.success("验证码已重新发送");
            }
        } catch (error) {
            toast.error("发送验证码失败");
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex h-screen w-full flex-col items-center justify-center px-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title class="text-lg md:text-xl">创建账号</Card.Title>
            <Card.Description class="text-xs md:text-sm">
                使用邮箱或社交账号注册
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form
                class="grid gap-4"
                onsubmit={isOtpMode ? handleOTPSignUp : handleEmailSignUp}
            >
                <div class="grid gap-2">
                    <Label for="email">邮箱</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        bind:value={email}
                        disabled={loading || (isOtpMode && otpSent)}
                        required
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="password">密码</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="至少 8 位"
                        bind:value={password}
                        disabled={loading || (isOtpMode && otpSent)}
                        required
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="confirmPassword">确认密码</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="再次输入密码"
                        bind:value={confirmPassword}
                        disabled={loading || (isOtpMode && otpSent)}
                        required
                    />
                </div>

                {#if isOtpMode}
                    <!-- OTP 验证码输入 -->
                    <div class="grid gap-2">
                        <div class="flex items-center justify-between">
                            <Label for="otp">验证码</Label>
                            {#if otpSent}
                                <Button
                                    type="button"
                                    variant="link"
                                    class="h-auto p-0 text-xs"
                                    disabled={loading}
                                    onclick={resendOTP}
                                >
                                    重新发送
                                </Button>
                            {/if}
                        </div>
                        <Input
                            id="otp"
                            type="text"
                            placeholder={otpSent
                                ? "请输入 6 位验证码"
                                : "点击注册按钮发送验证码"}
                            bind:value={otp}
                            disabled={loading || !otpSent}
                            maxlength={6}
                            class="text-center text-lg tracking-widest"
                        />
                        {#if otpSent}
                            <p class="text-xs text-muted-foreground">
                                验证码已发送到 {email}
                            </p>
                        {/if}
                    </div>
                {/if}

                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    {#if isOtpMode}
                        {otpSent ? "验证并注册" : "发送验证码"}
                    {:else}
                        注册
                    {/if}
                </Button>

                {#if isOtpMode && otpSent}
                    <Button
                        type="button"
                        variant="ghost"
                        class="w-full"
                        disabled={loading}
                        onclick={() => {
                            otpSent = false;
                            emailChecked = false;
                            otp = "";
                        }}
                    >
                        修改邮箱
                    </Button>
                {/if}
            </form>

            <div class="relative my-4">
                <div class="absolute inset-0 flex items-center">
                    <span class="w-full border-t"></span>
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                    <span class="bg-background px-2 text-muted-foreground"
                        >或</span
                    >
                </div>
            </div>

            <div
                class={cn(
                    "flex w-full items-center gap-2",
                    "flex-col justify-between",
                )}
            >
                <Button
                    variant="outline"
                    class={cn("w-full gap-2")}
                    disabled={loading}
                    onclick={handleGoogleSignUp}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="0.98em"
                        height="1em"
                        viewBox="0 0 256 262"
                    >
                        <path
                            fill="#4285F4"
                            d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                        ></path>
                        <path
                            fill="#34A853"
                            d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                        ></path>
                        <path
                            fill="#FBBC05"
                            d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                        ></path>
                        <path
                            fill="#EB4335"
                            d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                        ></path>
                    </svg>
                    使用 Google 注册
                </Button>
            </div>
        </Card.Content>
        <Card.Footer class="flex justify-center">
            <p class="text-sm text-muted-foreground">
                已有账号?
                <a href="/sign-in" class="text-primary hover:underline">
                    立即登录
                </a>
            </p>
        </Card.Footer>
    </Card.Root>
    <p
        class="mt-6 max-w-md text-center text-xs text-gray-500 dark:text-gray-400"
    >
        注册即表示您同意我们的
        <a
            href="/terms-of-service"
            class="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
            服务条款
        </a>
        和
        <a
            href="/privacy-policy"
            class="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
            隐私政策
        </a>
    </p>
</div>
