(function () {
    "use strict";

    var fs = require("fs");
    var path = require("path");
    var child = require("child_process");
    var os = require("os");

    var cs = window.CSInterface ? new CSInterface() : null;
    var extensionRoot = path.resolve(__dirname, "..");
    var backendPath = path.join(extensionRoot, "backend.py");
    var pythonProcess = null;
    var selectedMedia = "";
    var transcriptData = null;
    var cancelling = false;

    var $ = function (id) { return document.getElementById(id); };

    function setStatus(text, progress) {
        $("status").textContent = text || "";
        if (typeof progress === "number") {
            $("progressBar").style.width = Math.max(0, Math.min(100, progress)) + "%";
        }
    }

    function setBusy(busy) {
        $("browseMedia").disabled = busy;
        $("browsePython").disabled = busy;
        $("model").disabled = busy;
        $("language").disabled = busy;
        $("transcribe").disabled = busy;
        $("cancel").classList.toggle("hidden", !busy);
    }

    function escapeJsonForLine(obj) {
        return JSON.stringify(obj);
    }

    function getPythonPath() {
        var value = $("pythonPath").value.trim();
        if (value) return value;
        return localStorage.getItem("titlebuzz.python") || "python";
    }

    function savePythonPath() {
        var value = $("pythonPath").value.trim();
        if (value) localStorage.setItem("titlebuzz.python", value);
    }

    function chooseMedia() {
        var result = window.cep.fs.showOpenDialog(
            false, false, "Select audio or video", "", 
            ["mp3","wav","m4a","aac","flac","ogg","wma","mp4","mov","mkv","avi","webm","m4v"]
        );

        if (!result || result.err !== 0 || !result.data || !result.data.length) return;
        selectedMedia = result.data[0];
        $("mediaName").textContent = path.basename(selectedMedia);
        $("mediaPath").textContent = selectedMedia;
        setStatus("Media selected. Ready.", 0);
    }

    function choosePython() {
        var result = window.cep.fs.showOpenDialog(
            false, false, "Select Python executable", "", 
            os.platform() === "win32" ? ["exe"] : ["bin"]
        );
        if (!result || result.err !== 0 || !result.data || !result.data.length) return;
        $("pythonPath").value = result.data[0];
        savePythonPath();
        setStatus("Python path saved.", 0);
    }

    function parseLine(line) {
        var msg;
        try { msg = JSON.parse(line); } catch (e) { return; }
        if (!msg || !msg.type) return;

        if (msg.type === "status") {
            setStatus(msg.message || "", typeof msg.progress === "number" ? msg.progress : null);
        } else if (msg.type === "result") {
            transcriptData = msg;
            $("result").value = msg.text || "";
            $("detected").textContent = msg.language ? ("Detected: " + msg.language) : "";
            setStatus("Transcription complete.", 100);
            setBusy(false);
            pythonProcess = null;
        } else if (msg.type === "error") {
            setStatus(msg.message || "Unknown error.", 0);
            setBusy(false);
            pythonProcess = null;
            alert("TitleBuzz error:\n\n" + (msg.message || "Unknown error."));
        } else if (msg.type === "cancelled") {
            setStatus("Cancelled.", 0);
            setBusy(false);
            pythonProcess = null;
        }
    }

    function startPython() {
        if (pythonProcess) return true;

        var python = getPythonPath();
        try {
            pythonProcess = child.spawn(python, [backendPath], {
                cwd: extensionRoot,
                windowsHide: true,
                stdio: ["pipe", "pipe", "pipe"]
            });
        } catch (e) {
            pythonProcess = null;
            alert("Could not start Python:\n\n" + e.message);
            return false;
        }

        var buffer = "";
        pythonProcess.stdout.setEncoding("utf8");
        pythonProcess.stdout.on("data", function (chunk) {
            buffer += chunk;
            var lines = buffer.split(/\r?\n/);
            buffer = lines.pop();
            for (var i = 0; i < lines.length; i++) parseLine(lines[i]);
        });

        pythonProcess.stderr.setEncoding("utf8");
        pythonProcess.stderr.on("data", function (chunk) {
            console.log("[TitleBuzz Python]", chunk);
        });

        pythonProcess.on("error", function (err) {
            pythonProcess = null;
            setBusy(false);
            setStatus("Python could not be started.", 0);
            alert(
                "Python could not be started.\n\n" +
                "Check the Python path in the panel.\n\n" + err.message
            );
        });

        pythonProcess.on("exit", function (code) {
            if (pythonProcess) {
                pythonProcess = null;
                if (code !== 0 && !cancelling) {
                    setBusy(false);
                    setStatus("Python exited unexpectedly.", 0);
                }
            }
        });

        return true;
    }

    function sendCommand(command) {
        if (!pythonProcess || !pythonProcess.stdin.writable) return false;
        pythonProcess.stdin.write(escapeJsonForLine(command) + "\n");
        return true;
    }

    function transcribe() {
        if (!selectedMedia) {
            alert("Please choose an audio or video file first.");
            return;
        }
        if (!fs.existsSync(selectedMedia)) {
            alert("The selected media file no longer exists.");
            return;
        }

        savePythonPath();
        if (!fs.existsSync(backendPath)) {
            alert("backend.py was not found:\n\n" + backendPath);
            return;
        }

        transcriptData = null;
        cancelling = false;
        $("result").value = "";
        $("detected").textContent = "";
        setBusy(true);
        setStatus("Starting Python Whisper engine...", 2);

        if (!startPython()) {
            setBusy(false);
            return;
        }

        var command = {
            cmd: "transcribe",
            audio_path: selectedMedia,
            model: $("model").value,
            language: $("language").value || null
        };

        if (!sendCommand(command)) {
            setBusy(false);
            alert("Could not send the transcription request to Python.");
        }
    }

    function cancel() {
        if (!pythonProcess) return;
        cancelling = true;
        setStatus("Cancelling...", 0);
        try { sendCommand({cmd: "cancel"}); } catch (e) {}
        setTimeout(function () {
            if (pythonProcess) {
                try { pythonProcess.kill(); } catch (e) {}
                pythonProcess = null;
                setBusy(false);
                setStatus("Cancelled.", 0);
            }
        }, 1200);
    }

    function saveTextFile() {
        var text = $("result").value;
        if (!text.trim()) {
            alert("There is no transcript to save.");
            return;
        }

        var base = selectedMedia ? path.basename(selectedMedia, path.extname(selectedMedia)) : "transcript";
        var result = window.cep.fs.showSaveDialogEx(
            "Save transcript",
            "",
            ["txt"],
            base + ".txt",
            "Text file"
        );
        if (!result || result.err !== 0 || !result.data) return;

        var target = Array.isArray(result.data) ? result.data[0] : result.data;
        var write = window.cep.fs.writeFile(target, text, "UTF-8");
        if (write.err === 0) setStatus("TXT saved.", 100);
        else alert("Could not save TXT. Error: " + write.err);
    }

    function formatSrtTime(seconds) {
        seconds = Math.max(0, Number(seconds) || 0);
        var ms = Math.round(seconds * 1000);
        var h = Math.floor(ms / 3600000);
        ms -= h * 3600000;
        var m = Math.floor(ms / 60000);
        ms -= m * 60000;
        var s = Math.floor(ms / 1000);
        ms -= s * 1000;
        function pad(n, len) {
            var x = String(n);
            while (x.length < len) x = "0" + x;
            return x;
        }
        return pad(h, 2) + ":" + pad(m, 2) + ":" + pad(s, 2) + "," + pad(ms, 3);
    }

    function makeSrt() {
        if (!transcriptData || !transcriptData.segments || !transcriptData.segments.length) {
            alert("No timestamped segments are available. Transcribe a file first.");
            return "";
        }

        var out = [];
        for (var i = 0; i < transcriptData.segments.length; i++) {
            var seg = transcriptData.segments[i];
            var text = (seg.text || "").replace(/\r?\n/g, " ").trim();
            if (!text) continue;
            out.push(
                String(out.length + 1),
                formatSrtTime(seg.start) + " --> " + formatSrtTime(seg.end),
                text,
                ""
            );
        }
        return out.join("\r\n");
    }

    function saveSrtFile() {
        var srt = makeSrt();
        if (!srt) return;

        var base = selectedMedia ? path.basename(selectedMedia, path.extname(selectedMedia)) : "transcript";
        var result = window.cep.fs.showSaveDialogEx(
            "Save subtitles",
            "",
            ["srt"],
            base + ".srt",
            "SubRip subtitle"
        );
        if (!result || result.err !== 0 || !result.data) return;

        var target = Array.isArray(result.data) ? result.data[0] : result.data;
        var write = window.cep.fs.writeFile(target, srt, "UTF-8");
        if (write.err === 0) setStatus("SRT saved. Import it into Premiere Pro as captions.", 100);
        else alert("Could not save SRT. Error: " + write.err);
    }

    function copyText() {
        var text = $("result").value;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function () {
            setStatus("Transcript copied.", 100);
        }).catch(function () {
            $("result").focus();
            $("result").select();
            document.execCommand("copy");
            setStatus("Transcript copied.", 100);
        });
    }

    function init() {
        var savedPython = localStorage.getItem("titlebuzz.python");
        $("pythonPath").value = savedPython || "python";

        $("browseMedia").addEventListener("click", chooseMedia);
        $("browsePython").addEventListener("click", choosePython);
        $("transcribe").addEventListener("click", transcribe);
        $("cancel").addEventListener("click", cancel);
        $("saveTxt").addEventListener("click", saveTextFile);
        $("saveSrt").addEventListener("click", saveSrtFile);
        $("copy").addEventListener("click", copyText);
        $("pythonPath").addEventListener("change", savePythonPath);

        setStatus("Ready. Choose a media file.", 0);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
