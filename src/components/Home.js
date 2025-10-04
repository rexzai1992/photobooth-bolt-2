@@ .. @@
        <button onClick={() => navigate("/welcome")} className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition"
        >START</button>

+        <button 
+          onClick={() => navigate("/admin")} 
+          data-testid="admin-login-button"
+          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
+        >
+          Admin Login
+        </button>
+
        <footer className="mt-8 text-sm text-gray-600">